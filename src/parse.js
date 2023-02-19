/* eslint-enable no-param-reassign */

const parse = (rssString) => {
  const parser = new DOMParser();
  const rssDocument = parser.parseFromString(rssString, 'application/xml');
  const errorNode = rssDocument.querySelector('parsererror');
  if (errorNode) {
    return { title: null, description: null, posts: [] };
  }
  const title = rssDocument.querySelector('title').textContent;
  const description = rssDocument.querySelector('description').textContent;
  const items = rssDocument.querySelectorAll('item');
  const posts = Array.from(items).map((item) => {
    const postTitle = item.querySelector('title').textContent;
    const postLink = item.querySelector('link').textContent;
    const postDescription = item.querySelector('description').textContent;
    const newPost = {
      postTitle, postLink, postDescription,
    };
    return newPost;
  });
  return { title, description, posts };
};

export default parse;
