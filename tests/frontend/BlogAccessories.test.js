import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import BlogAccessories from '../../src/BlogAccessories';
import { mockApi } from './support/mockApi';
import { currentPath, renderAt } from './support/render';

const renderPost = (slug) => {
  const fetch = mockApi();
  renderAt(<BlogAccessories />, { route: `/content/${slug}`, path: '/content/:slug' });
  return fetch;
};

const back = () => screen.getByTestId('ArrowBackIosIcon').closest('button');
const next = async () => (await screen.findByTestId('ArrowForwardIosIcon')).closest('button');

test('next goes to the following star in the constellation', async () => {
  renderPost('jails-part-two');
  fireEvent.click(await next());
  expect(currentPath(screen)).toBe('/content/jails-part-three');
});

test('back goes to the previous star in the constellation', async () => {
  renderPost('jails-part-two');
  await next(); // navigation data has loaded
  fireEvent.click(back());
  expect(currentPath(screen)).toBe('/content/kyua-test');
});

test('back from the first star goes home', async () => {
  renderPost('kyua-test');
  await next();
  fireEvent.click(back());
  expect(currentPath(screen)).toBe('/');
});

test.each(['jails-part-three', 'storybook'])('%s has no next arrow', async (slug) => {
  const fetch = renderPost(slug);
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
  expect(screen.queryByTestId('ArrowForwardIosIcon')).not.toBeInTheDocument();
});
