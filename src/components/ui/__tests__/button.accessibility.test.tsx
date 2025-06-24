
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from '../button'

describe('Button Accessibility', () => {
  it('should have proper accessibility attributes', () => {
    render(<Button>Accessible Button</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('type', 'button')
  })

  it('should support aria-label', () => {
    render(<Button aria-label="Custom aria label">Button</Button>)
    const button = screen.getByLabelText('Custom aria label')
    
    expect(button).toBeInTheDocument()
  })

  it('should support aria-describedby', () => {
    render(
      <div>
        <Button aria-describedby="button-description">Button</Button>
        <div id="button-description">This is a button description</div>
      </div>
    )
    const button = screen.getByRole('button')
    
    expect(button).toHaveAttribute('aria-describedby', 'button-description')
  })

  it('should be focusable by default', () => {
    render(<Button>Focusable Button</Button>)
    const button = screen.getByRole('button')
    
    expect(button).not.toHaveAttribute('tabindex', '-1')
  })

  it('should have focus-visible styles', () => {
    render(<Button>Focus Button</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring')
  })
})
