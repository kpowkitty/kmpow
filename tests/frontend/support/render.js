import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

function LocationProbe() {
  return <div data-testid="location" hidden>{useLocation().pathname}</div>;
}

export function renderAt(ui, { route = '/', path = '*' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={<>{ui}<LocationProbe /></>} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

export const currentPath = (screen) => screen.getByTestId('location').textContent;
