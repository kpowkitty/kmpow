import { fireEvent, screen } from '@testing-library/react';
import FadeAppBar from '../../src/FadeAppBar';
import { currentPath, renderAt } from './support/render';

const button = (icon) => screen.getByTestId(icon).closest('button');

describe('FadeAppBar (top)', () => {
  test.each([
    ['HomeIcon', '/'],
    ['InfoIcon', '/about'],
    ['DescriptionIcon', '/resume'],
    ['ContactMailIcon', '/contact'],
  ])('%s navigates to %s', (icon, path) => {
    renderAt(<FadeAppBar position="top" />, { route: '/somewhere' });
    fireEvent.click(button(icon));
    expect(currentPath(screen)).toBe(path);
  });
});

describe('FadeAppBar (bottom)', () => {
  test('shows the footer instead of nav', () => {
    renderAt(<FadeAppBar position="bottom" />);
    expect(screen.getByText(/kmpow \| @kpowkitty/)).toBeInTheDocument();
    expect(screen.queryByTestId('HomeIcon')).not.toBeInTheDocument();
  });
});
