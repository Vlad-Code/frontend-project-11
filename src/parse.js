/* eslint-disable no-param-reassign */
import _ from 'lodash';

const parse = (response) => {
  const stringXML = response.data.contents;
  const parser = new DOMParser();
  const doc = parser.parseFromString(stringXML, 'application/xml');
  return doc;
};

const buildData = (response, watchedState) => {
  const rssDocument = parse(response);
  const errorNode = rssDocument.querySelector('parsererror');
  if (errorNode) {
    console.log(errorNode);
    watchedState.rssLoading.state = 'failed';
    watchedState.rssLoading.error = 'ERR_CONTENT';
    watchedState.formRegistration.feeds.pop();
    return;
  }
  const feedTitle = rssDocument.querySelector('title').textContent;
  const feedDescription = rssDocument.querySelector('description').textContent;
  const feedUrl = watchedState.formRegistration.url;
  const newFeed = {
    feedTitle, feedDescription, id: _.uniqueId(), feedUrl,
  };
  watchedState.rssLoading.feeds.push(newFeed);
  watchedState.rssLoading.error = null;
  const items = rssDocument.querySelectorAll('item');
  items.forEach((item) => {
    const itemTitle = item.querySelector('title').textContent;
    const itemLink = item.querySelector('link').textContent;
    const itemDescription = item.querySelector('description').textContent;
    const itemId = newFeed.id;
    const newItem = {
      itemTitle, itemLink, itemId, itemDescription,
    };
    watchedState.rssLoading.posts.push(newItem);
  });
  watchedState.rssLoading.state = 'processed';
};

export default buildData;