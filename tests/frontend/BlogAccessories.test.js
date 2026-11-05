import { act, fireEvent, screen } from '@testing-library/react';
import BlogAccessories from '../../src/BlogAccessories';
import { mockApi } from './support/mockApi';
import { currentPath, renderAt } from './support/render';

// The mocked fetches resolve immediately, so one macrotask lets the component finish loading.
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

const renderPost = async (slug) => {
  const fetch = mockApi();
  await act(async () => {
    renderAt(<BlogAccessories />, { route: `/content/${slug}`, path: '/content/:slug' });
  });
  await settle();
  return fetch;
};

const click = async (button) => {
  fireEvent.click(button);
  await settle();
};

const back = () => screen.getByTestId('ArrowBackIosIcon').closest('button');
const next = () => screen.getByTestId('ArrowForwardIosIcon').closest('button');

test('next goes to the following star in the constellation', async () => {
  await renderPost('jails-part-two');
  await click(next());
  expect(currentPath(screen)).toBe('/content/jails-part-three');
});

test('back goes to the previous star in the constellation', async () => {
  await renderPost('jails-part-two');
  await click(back());
  expect(currentPath(screen)).toBe('/content/kyua-test');
});

test('back from the first star goes home', async () => {
  await renderPost('kyua-test');
  await click(back());
  expect(currentPath(screen)).toBe('/');
});

test.each(['jails-part-three', 'storybook'])('%s has no next arrow', async (slug) => {
  const fetch = await renderPost(slug);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(screen.queryByTestId('ArrowForwardIosIcon')).not.toBeInTheDocument();
});
