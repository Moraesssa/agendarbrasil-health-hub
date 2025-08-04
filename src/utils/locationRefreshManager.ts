/**
 * Location Refresh Manager
 * Handles automatic and manual refresh of location data with priority queuing
 */

import { logger } from '@/utils/logger';
import { enhancedLocationService } from '@/services/enhancedLocationService';

export type RefreshPriority = 'critical' | 'normal' | 'background';
export type RefreshStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

interface RefreshTask {
  id: string;
  locationId?: string;
  priority: RefreshPriority;
  status: RefreshStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

interface RefreshStats {
  totalRefreshes: number;
  successfulRefreshes: number;
  failedRefreshes: number;
  averageRefreshTime: number;
  activeRefreshes: number;
  queuedRefreshes: number;
}

class LocationRefreshManager {
  private tasks = new Map<string, RefreshTask>();
  private queue: RefreshTask[] = [];
  private isProcessing = false;
  private stats: RefreshStats = {
    totalRefreshes: 0,
    successfulRefreshes: 0,
    failedRefreshes: 0,
    averageRefreshTime: 0,
    activeRefreshes: 0,
    queuedRefreshes: 0
  };

  private readonly MAX_CONCURRENT_REFRESHES = 3;
  private readonly RETRY_DELAYS = {
    critical: [1000, 2000, 5000],
    normal: [2000, 5000, 10000],
    background: [5000, 15000, 30000]
  };

  /**
   * Refresh a specific location
   */
  refreshLocation(locationId: string, priority: RefreshPriority = 'normal'): string {
    const taskId = this.generateTaskId();
    
    const task: RefreshTask = {
      id: taskId,
      locationId,
      priority,
      status: 'pending',
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: this.RETRY_DELAYS[priority].length
    };

    this.tasks.set(taskId, task);
    this.addToQueue(task);

    logger.info('Location refresh task created', 'locationRefreshManager', {
      taskId,
      locationId,
      priority
    });

    this.processQueue();
    return taskId;
  }

  /**
   * Refresh multiple locations
   */
  refreshLocations(locationIds: string[], priority: RefreshPriority = 'normal'): string {
    const taskId = this.generateTaskId();
    
    const task: RefreshTask = {
      id: taskId,
      priority,
      status: 'pending',
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: this.RETRY_DELAYS[priority].length
    };

    (task as any).locationIds = locationIds;

    this.tasks.set(taskId, task);
    this.addToQueue(task);

    this.processQueue();
    return taskId;
  }

  /**
   * Refresh all locations
   */
  refreshAllLocations(priority: RefreshPriority = 'background'): string {
    const taskId = this.generateTaskId();
    
    const task: RefreshTask = {
      id: taskId,
      priority,
      status: 'pending',
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: this.RETRY_DELAYS[priority].length
    };

    (task as any).refreshAll = true;

    this.tasks.set(taskId, task);
    this.addToQueue(task);

    this.processQueue();
    return taskId;
  }

  /**
   * Force refresh with highest priority
   */
  forceRefresh(locationId: string): string {
    this.cancelLocationTasks(locationId);
    return this.refreshLocation(locationId, 'critical');
  }

  /**
   * Get refresh statistics
   */
  getStats(): RefreshStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Manually process queue (for testing)
   */
  async processQueueManually(): Promise<void> {
    await this.processQueue();
  }

  // Private methods
  private generateTaskId(): string {
    return `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToQueue(task: RefreshTask): void {
    const priorityOrder = { critical: 0, normal: 1, background: 2 };
    const taskPriority = priorityOrder[task.priority];

    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      const queuePriority = priorityOrder[this.queue[i].priority];
      if (taskPriority < queuePriority) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, task);
    this.updateStats();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    try {
      // In test environment, don't auto-process to avoid timing issues
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
        return;
      }

      while (this.queue.length > 0 && this.getActiveTaskCount() < this.MAX_CONCURRENT_REFRESHES) {
        const task = this.queue.shift();
        if (task) {
          this.executeTask(task);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeTask(task: RefreshTask): Promise<void> {
    task.status = 'in_progress';
    task.startedAt = new Date();
    this.updateStats();

    try {
      const startTime = Date.now();

      if (task.locationId) {
        await enhancedLocationService.refreshLocationData(task.locationId);
      } else if ((task as any).locationIds) {
        const locationIds = (task as any).locationIds as string[];
        for (const locationId of locationIds) {
          await enhancedLocationService.refreshLocationData(locationId);
        }
      } else if ((task as any).refreshAll) {
        await enhancedLocationService.refreshLocationData();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      task.status = 'completed';
      task.completedAt = new Date();
      
      this.stats.successfulRefreshes++;
      this.updateAverageRefreshTime(duration);

    } catch (error) {
      await this.handleTaskError(task, error);
    }

    this.updateStats();
    setTimeout(() => this.processQueue(), 100);
  }

  private async handleTaskError(task: RefreshTask, error: any): Promise<void> {
    task.retryCount++;
    
    if (task.retryCount <= task.maxRetries) {
      const delay = this.RETRY_DELAYS[task.priority][task.retryCount - 1] || 30000;
      
      task.status = 'pending';
      task.error = error.message;

      setTimeout(() => {
        this.addToQueue(task);
        this.processQueue();
      }, delay);

    } else {
      task.status = 'failed';
      task.completedAt = new Date();
      task.error = error.message;
      this.stats.failedRefreshes++;
    }
  }

  private cancelLocationTasks(locationId: string): number {
    let cancelledCount = 0;
    
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.locationId === locationId && task.status === 'pending') {
        const queueIndex = this.queue.findIndex(t => t.id === taskId);
        if (queueIndex !== -1) {
          this.queue.splice(queueIndex, 1);
          this.tasks.delete(taskId);
          cancelledCount++;
        }
      }
    }

    return cancelledCount;
  }

  private getActiveTaskCount(): number {
    let count = 0;
    for (const task of this.tasks.values()) {
      if (task.status === 'in_progress') {
        count++;
      }
    }
    return count;
  }

  private updateStats(): void {
    this.stats.activeRefreshes = this.getActiveTaskCount();
    this.stats.queuedRefreshes = this.queue.length;
    this.stats.totalRefreshes = this.stats.successfulRefreshes + this.stats.failedRefreshes;
  }

  private updateAverageRefreshTime(newTime: number): void {
    const totalSuccessful = this.stats.successfulRefreshes;
    if (totalSuccessful === 1) {
      this.stats.averageRefreshTime = newTime;
    } else {
      this.stats.averageRefreshTime = 
        (this.stats.averageRefreshTime * (totalSuccessful - 1) + newTime) / totalSuccessful;
    }
  }
}

export const locationRefreshManager = new LocationRefreshManager();

export const refreshUtils = {
  schedulePeriodicRefresh(intervalMs: number = 15 * 60 * 1000): () => void {
    const intervalId = setInterval(() => {
      locationRefreshManager.refreshAllLocations('background');
    }, intervalMs);

    return () => clearInterval(intervalId);
  },

  async prefreshPopularLocations(locationIds: string[]): Promise<void> {
    if (locationIds.length === 0) return;
    locationRefreshManager.refreshLocations(locationIds, 'normal');
  },

  emergencyRefresh(locationIds: string[]): string[] {
    return locationIds.map(locationId => 
      locationRefreshManager.forceRefresh(locationId)
    );
  }
};

export default locationRefreshManager;