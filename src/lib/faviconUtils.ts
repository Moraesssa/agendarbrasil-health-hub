


import * as anime from 'animejs';

export class FaviconAnimator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animation: any | null = null;
  private isAnimating = false;
  private size = 32;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.ctx = this.canvas.getContext('2d')!;
  }

  private drawECGHeart(progress: number = 1) {
    this.ctx.clearRect(0, 0, this.size, this.size);
    
    // Cores do tema
    const primaryColor = '#2563eb';
    const heartColor = '#ef4444';
    
    // Criar gradiente
    const gradient = this.ctx.createLinearGradient(0, 0, this.size, this.size);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, heartColor);
    
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // Desenhar linha ECG que forma um coração
    this.ctx.beginPath();
    
    // Linha ECG estilizada em formato de coração
    const centerX = this.size / 2;
    const centerY = this.size / 2;
    const scale = 0.8;
    
    // Pontos da linha ECG formando coração
    const points = [
      [4, 16], [6, 16], [8, 12], [10, 20], [12, 8], [14, 18], [16, 16],
      [18, 12], [20, 20], [22, 8], [24, 18], [26, 16], [28, 16]
    ];
    
    // Desenhar linha ECG com progresso
    const totalPoints = points.length;
    const currentPoints = Math.floor(totalPoints * progress);
    
    if (currentPoints > 0) {
      this.ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < currentPoints; i++) {
        this.ctx.lineTo(points[i][0], points[i][1]);
      }
      this.ctx.stroke();
    }
    
    // Se animação completa, desenhar coração
    if (progress >= 1) {
      this.ctx.fillStyle = gradient;
      this.ctx.globalAlpha = 0.3;
      
      // Desenhar coração base
      this.ctx.beginPath();
      const x = centerX;
      const y = centerY - 2;
      const width = 12;
      const height = 10;
      
      this.ctx.moveTo(x, y + height / 4);
      this.ctx.quadraticCurveTo(x, y, x - width / 4, y);
      this.ctx.quadraticCurveTo(x - width / 2, y, x - width / 2, y + height / 4);
      this.ctx.quadraticCurveTo(x - width / 2, y + height / 2, x, y + height);
      this.ctx.quadraticCurveTo(x + width / 2, y + height / 2, x + width / 2, y + height / 4);
      this.ctx.quadraticCurveTo(x + width / 2, y, x + width / 4, y);
      this.ctx.quadraticCurveTo(x, y, x, y + height / 4);
      
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    }
  }

  private updateFavicon() {
    const dataUrl = this.canvas.toDataURL('image/png');
    
    // Encontrar ou criar link do favicon
    let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      document.head.appendChild(link);
    }
    
    link.href = dataUrl;
  }

  public startAnimation() {
    if (this.isAnimating) return;
    
    // Verificar preferência do usuário para animações
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.drawECGHeart(1);
      this.updateFavicon();
      return;
    }
    
    this.isAnimating = true;
    
    const animationLoop = () => {
      this.animation = anime({
        targets: { progress: 0 },
        progress: 1,
        duration: 2000,
        easing: 'easeInOutQuad',
        update: (anim: any) => {
          const progress = (anim.animatables[0].target as any).progress;
          this.drawECGHeart(progress);
          this.updateFavicon();
        },
        complete: () => {
          // Pulso do coração
          anime({
            targets: { scale: 1 },
            scale: [1, 1.1, 1],
            duration: 600,
            easing: 'easeInOutQuad',
            update: (anim: any) => {
              const scale = (anim.animatables[0].target as any).scale;
              this.ctx.save();
              this.ctx.scale(scale, scale);
              this.drawECGHeart(1);
              this.ctx.restore();
              this.updateFavicon();
            },
            complete: () => {
              // Pausa antes de reiniciar
              setTimeout(() => {
                if (this.isAnimating) {
                  animationLoop();
                }
              }, 1500);
            }
          });
        }
      });
    };
    
    animationLoop();
  }

  public stopAnimation() {
    this.isAnimating = false;
    if (this.animation) {
      this.animation.pause();
    }
    
    // Mostrar favicon estático
    this.drawECGHeart(1);
    this.updateFavicon();
  }

  public setStaticFavicon() {
    this.drawECGHeart(1);
    this.updateFavicon();
  }
}

// Instância global
let faviconAnimator: FaviconAnimator | null = null;

export const initializeFavicon = () => {
  if (typeof window === 'undefined') return;
  
  if (!faviconAnimator) {
    faviconAnimator = new FaviconAnimator();
  }
  
  // Verificar se deve animar
  const shouldAnimate = localStorage.getItem('favicon-animation') !== 'false';
  
  if (shouldAnimate) {
    faviconAnimator.startAnimation();
  } else {
    faviconAnimator.setStaticFavicon();
  }
};

export const toggleFaviconAnimation = () => {
  if (!faviconAnimator) return;
  
  const currentSetting = localStorage.getItem('favicon-animation') !== 'false';
  const newSetting = !currentSetting;
  
  localStorage.setItem('favicon-animation', newSetting.toString());
  
  if (newSetting) {
    faviconAnimator.startAnimation();
  } else {
    faviconAnimator.stopAnimation();
  }
  
  return newSetting;
};
