import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('should render loading spinner with default size', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('flex', 'justify-center', 'items-center');
  });

  it('should render with small size', () => {
    const { container } = render(<LoadingSpinner size="small" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('w-5', 'h-5');
  });

  it('should render with medium size', () => {
    const { container } = render(<LoadingSpinner size="medium" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('w-8', 'h-8');
  });

  it('should render with large size', () => {
    const { container } = render(<LoadingSpinner size="large" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('w-12', 'h-12');
  });

  it('should apply custom className', () => {
    const customClass = 'custom-spinner-class';
    render(<LoadingSpinner className={customClass} />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass(customClass);
  });

  it('should have spinning animation', () => {
    const { container } = render(<LoadingSpinner />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('animate-spin');
  });

  it('should render accessible text', () => {
    render(<LoadingSpinner />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle no props', () => {
    expect(() => render(<LoadingSpinner />)).not.toThrow();
  });

  it('should handle multiple instances', () => {
    const { container } = render(
      <div>
        <LoadingSpinner size="small" />
        <LoadingSpinner size="large" />
      </div>
    );
    
    const spinners = container.querySelectorAll('[role="status"]');
    expect(spinners).toHaveLength(2);
  });
});

