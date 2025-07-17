import anime from 'animejs';

// Interface para definir a forma do objeto de animação
interface AnimationState {
  progress: number;
  scale: number;
}

export class FaviconAnimator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animation: anime.AnimeInstance | null = null;
  private isAnimating = false;
  private size = 32;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Não foi possível obter o contexto 2D do canvas.');
    }
    this.ctx = context;
  }

  /**
   * Desenha o coração e a linha de ECG no canvas.
   * @param progress - O progresso do desenho da linha de ECG (0 a 1).
   */
  private drawECGHeart(progress: number = 1) {
    // Cores do tema
    const primaryColor = '#2563eb'; // blue-600
    const heartColor = '#ef4444'; // red-500

    // Criar gradiente
    const gradient = this.ctx.createLinearGradient(0, 0, this.size, this.size);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, heartColor);

    // Configurações do traço
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Pontos da linha ECG que formam um coração
    const points = [
      [4, 16], [6, 16], [8, 12], [10, 20], [12, 8], [14, 18], [16, 16],
      [18, 12], [20, 20], [22, 8], [24, 18], [26, 16], [28, 16]
    ];

    // Desenha a linha de ECG com base no progresso
    this.ctx.beginPath();
    const totalPoints = points.length;
    const currentPoints = Math.floor(totalPoints * progress);

    if (currentPoints > 0) {
      this.ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < currentPoints; i++) {
        this.ctx.lineTo(points[i][0], points[i][1]);
      }
      this.ctx.stroke();
    }

    // Se a animação da linha estiver completa, desenha o coração de fundo
    if (progress >= 1) {
      this.ctx.fillStyle = gradient;
      this.ctx.globalAlpha = 0.3;

      // Desenha o formato do coração
      this.ctx.beginPath();
      const centerX = this.size / 2;
      const centerY = this.size / 2;
      const width = 12;
      const height = 10;
      const x = centerX;
      const y = centerY - 2;

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

  /**
   * Atualiza o href do link do favicon no DOM.
   */
  private updateFavicon() {
    const dataUrl = this.canvas.toDataURL('image/png');
    let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      document.head.appendChild(link);
    }
    link.href = dataUrl;
  }

  /**
   * Inicia o loop de animação.
   */
  public startAnimation() {
    if (this.isAnimating) return;

    // Respeita a preferência do usuário por movimento reduzido
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.setStaticFavicon();
      return;
    }

    this.isAnimating = true;

    // Objeto que guardará os valores da animação
    const animationState: AnimationState = { progress: 0, scale: 1 };

    this.animation = anime({
      targets: animationState,
      loop: true,
      easing: 'easeInOutQuad',
      
      // Define a sequência de animação usando keyframes
      keyframes: [
        // 1. Animação de desenho da linha
        {
          progress: 1,
          scale: 1,
          duration: 2000,
        },
        // 2. Animação de pulso (escala)
        {
          scale: 1.1,
          duration: 300,
        },
        {
          scale: 1,
          duration: 300,
        },
        // 3. Pausa antes de repetir
        {
          progress: 1, // Mantém o progresso
          scale: 1,      // Mantém a escala
          duration: 1500,
        },
        // 4. Reseta para o próximo loop
        {
            progress: 0,
            duration: 0,
        }
      ],
      
      // A função update é chamada a cada frame da animação
      update: () => {
        this.ctx.clearRect(0, 0, this.size, this.size);
        this.ctx.save();
        
        // Aplica a escala a partir do centro do canvas
        this.ctx.translate(this.size / 2, this.size / 2);
        this.ctx.scale(animationState.scale, animationState.scale);
        this.ctx.translate(-this.size / 2, -this.size / 2);

        // Desenha o estado atual
        this.drawECGHeart(animationState.progress);
        
        this.ctx.restore();
        this.updateFavicon();
      },
    });
  }

  /**
   * Para a animação e restaura o favicon estático.
   */
  public stopAnimation() {
    this.isAnimating = false;
    if (this.animation) {
      anime.remove(this.animation.targets);
      this.animation = null;
    }
    this.setStaticFavicon();
  }

  /**
   * Define o favicon para seu estado final estático.
   */
  public setStaticFavicon() {
    this.ctx.clearRect(0, 0, this.size, this.size);
    this.drawECGHeart(1); // Garante que o coração completo seja desenhado
    this.updateFavicon();
  }
}

// --- Funções de Controle Exportadas ---

let faviconAnimator: FaviconAnimator | null = null;

/**
 * Inicializa o controlador do favicon.
 */
export const initializeFavicon = () => {
  if (typeof window === 'undefined') return;

  if (!faviconAnimator) {
    faviconAnimator = new FaviconAnimator();
  }

  const shouldAnimate = localStorage.getItem('favicon-animation') !== 'false';

  if (shouldAnimate) {
    faviconAnimator.startAnimation();
  } else {
    faviconAnimator.setStaticFavicon();
  }
};

/**
 * Alterna entre a animação ligada e desligada.
 */
export const toggleFaviconAnimation = (): boolean => {
  if (!faviconAnimator) {
     // Inicializa se ainda não foi
    faviconAnimator = new FaviconAnimator();
  }

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
