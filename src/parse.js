/* eslint-disable no-param-reassign */

const parse = (rssString) => {
  const feedAndPosts = { feed: null, posts: [] };
  const parser = new DOMParser();
  const rssDocument = parser.parseFromString(rssString, 'application/xml');
  const errorNode = rssDocument.querySelector('parsererror');
  if (errorNode) {
    return feedAndPosts;
  }
  const feedTitle = rssDocument.querySelector('title').textContent;
  const feedDescription = rssDocument.querySelector('description').textContent;
  const newFeed = {
    feedTitle, feedDescription,
  };
  feedAndPosts.feed = newFeed;
  const items = rssDocument.querySelectorAll('item');
  items.forEach((item) => {
    const postTitle = item.querySelector('title').textContent;
    const postLink = item.querySelector('link').textContent;
    const postDescription = item.querySelector('description').textContent;
    const newPost = {
      postTitle, postLink, postDescription,
    };
    feedAndPosts.posts.push(newPost);
  });
  return feedAndPosts;
};

export default parse;
