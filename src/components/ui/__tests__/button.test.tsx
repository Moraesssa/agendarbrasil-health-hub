
import { render, screen } from '../../../test/test-utils'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '../button'

describe('Button Component', () => {
  describe('Variants', () => {
    it('should render with default variant classes', () => {
      render(<Button>Default Button</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground', 'hover:bg-primary/90')
    })

    it('should render with destructive variant classes', () => {
      render(<Button variant="destructive">Destructive Button</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground', 'hover:bg-destructive/90')
    })

    it('should render with outline variant classes', () => {
      render(<Button variant="outline">Outline Button</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toHaveClass('border', 'border-input', 'bg-background', 'hover:bg-accent', 'hover:text-accent-foreground')
    })

    it('should render with secondary variant classes', () => {
      render(<Button variant="secondary">Secondary Button</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground', 'hover:bg-secondary/80')
    })

    it('should render with ghost variant classes', () => {
      render(<Button variant="ghost">Ghost Button</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground')
      expect(button).not.toHaveClass('bg-primary')
    })

    it('should render with link variant classes', () => {
      render(<Button variant="link">Link Button</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toHaveClass('text-primary', 'underline-offset-4', 'hover:underline')
    })
  })

  describe('Sizes', () => {
    it('should render with default size classes', () => {
      render(<Button>Default Size</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toHaveClass('h-10', 'px-4', 'py-2')
    })

    it('should render with small size classes', () => {
      render(<Button size="sm">Small Button</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toHaveClass('h-9', 'rounded-md', 'px-3')
    })

    it('should render with large size classes', () => {
      render(<Button size="lg">Large Button</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toHaveClass('h-11', 'rounded-md', 'px-8')
    })

    it('should render with icon size classes', () => {
      render(<Button size="icon">Icon</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toHaveClass('h-10', 'w-10')
    })
  })

  describe('Props and Functionality', () => {
    it('should render children correctly', () => {
      render(<Button>Test Content</Button>)
      
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should handle click events', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      
      render(<Button onClick={handleClick}>Clickable Button</Button>)
      
      await user.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
    })

    it('should apply custom className', () => {
      render(<Button className="custom-class">Custom Button</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toHaveClass('custom-class')
    })

    it('should forward additional HTML props', () => {
      render(<Button data-testid="custom-button" type="submit">Submit Button</Button>)
      const button = screen.getByTestId('custom-button')
      
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('should render as child component when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )
      
      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test')
      expect(link).toHaveClass('inline-flex', 'items-center', 'justify-center')
    })
  })

  describe('Combined Variants and Sizes', () => {
    it('should combine variant and size classes correctly', () => {
      render(<Button variant="outline" size="lg">Large Outline Button</Button>)
      const button = screen.getByRole('button')
      
      // Should have outline variant classes
      expect(button).toHaveClass('border', 'border-input', 'bg-background')
      // Should have large size classes
      expect(button).toHaveClass('h-11', 'rounded-md', 'px-8')
    })

    it('should combine destructive variant with small size', () => {
      render(<Button variant="destructive" size="sm">Small Destructive Button</Button>)
      const button = screen.getByRole('button')
      
      // Should have destructive variant classes
      expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground')
      // Should have small size classes
      expect(button).toHaveClass('h-9', 'px-3')
    })
  })

  describe('Base Classes', () => {
    it('should always have base classes regardless of variant and size', () => {
      render(<Button variant="ghost" size="icon">Base Test</Button>)
      const button = screen.getByRole('button')
      
      // Base classes should always be present
      expect(button).toHaveClass(
        'inline-flex',
        'items-center',
        'justify-center',
        'gap-2',
        'whitespace-nowrap',
        'rounded-md',
        'text-sm',
        'font-medium',
        'ring-offset-background',
        'transition-colors',
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-ring',
        'focus-visible:ring-offset-2'
      )
    })
  })
})
