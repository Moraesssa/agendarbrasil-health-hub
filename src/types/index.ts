// Export compatibility types first, then other types
export * from './database';
export * from './appointments';
export * from './appointmentService';
export * from './common';
export * from './payments';
export * from './profiles';
export * from './compatibility';
export * from './global';

// Load type augmentations
import './augmentations';