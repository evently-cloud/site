if(document.readyState === 'interactive' || document.readyState === 'complete') {
  loadWebMentions();
} else {
  document.addEventListener('DOMContentLoaded', function(event) {
    loadWebMentions();
  });
}

const loadWebMentions = () => {
  if(typeof fetch === 'undefined') {
    // We don't support browsers that don't have fetch
    return;
  }

  const elem = document.getElementById('webmentions');
  if(!elem) {
    // Not wanted on this page
    return;
  }

  let url = document.URL;
  url = url.replace(/^http:\/\/localhost:8080/, 'https://evently.cloud'); // fix dev url for lcoalhost

  return fetch('https://webmention.io/api/mentions?per-page=200&target=' + url)
    .then(response => response.json())
    .then(result => displayWebMentions(elem, result));
};

const displayWebMentions = (elem, result) => {
  if(!result.links.length) {
    // No mentions
    return;
  }

  let activityHtml = [];
  let likeHtml = [];
  let repostHtml = [];

  result.links.sort((a, b) => {
    return a.data.published_ts - b.data.published_ts;
  });

  for(const linkIdx in result.links) {
    const link = result.links[linkIdx];

    if(!link.data.author) {
      // Links without authors are not yet supported.
      continue;
    }

    switch(link.activity.type) {
      case 'like':
        likeHtml.push('<li>' + getAvatar(link, link.data.url) + '</li>');
        break;
      case 'repost':
        repostHtml.push('<li>' + getAvatar(link, link.data.url) + '</li>');
        break;
      case 'reply':
      case 'link':
        let publishedTime = getPublishedTime(link);
        if(publishedTime) publishedTime = ' • ' + publishedTime;
        let content = link.data.content;
        if(!content) {
          content = link.data.url;
        }
        activityHtml.push('<li class="comment">' + getAvatar(link) + '<div class="inner"><p>' + getAuthorName(link) + publishedTime + '</p>' + content + '</div></li>');
        break;
      default:
        if(link.activity.sentence_html) {
          activityHtml.push('<li>' + getAvatar(link) + ' <p>' + link.activity.sentence_html + '</p></li>');
        }
        break;
    }
  }

  let html = '';

  if(repostHtml.length) {
    html += '<div class="avatars"><h4>Reposts:</h4><ul>' + repostHtml.join('\n') + '</ul></div>\n';
  }
  if(likeHtml.length) {
    html += '<div class="avatars"><h4>Likes:</h4><ul>' + likeHtml.join('\n') + '</ul></div>\n';
  }
  if(activityHtml.length) {
    html += '<div class="mentions"><h4>Mentions:</h4><ul class="activity">' + activityHtml.join('\n') + '</ul></div>\n';
  }

  elem.innerHTML = html;
  document.getElementsByClassName('webmentions')[0].className = 'webmentions visible';
};

const getAvatar = (link, url) => {
  url = url ? url : link.data.author.url;

  if(link.data && link.data.author && link.data.author.photo) {
    return '<a href="' + formatString(url) + '" title="' + formatString(link.data.author.name) + '"><img src="' + formatString(link.data.author.photo) + '" alt="' + formatString(link.data.author.name) + '" /></a>';
  }

  return '';
};

const getAuthorName = (link, url) => {
  url = link.data.author.url;

  if(link.data && link.data.author) {
    return '<a href="' + formatString(url) + '" title="' + formatString(link.data.author.name) + '">' + formatString(link.data.author.name) + '</a>';
  }
};

const getPublishedTime = (link) => {
  if(!link.data.published_ts) {
    return '';
  }

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const d = new Date(link.data.published_ts * 1000);

  return '<time>' + months[d.getMonth()] + ' ' + d.getDate() + ' ' + d.getFullYear() + '</time>';
};

const formatString = (input) => {
  if(!input) {
    return '';
  }

  const charsToReplace = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  };

  return input.replace(/&|<|>|"/g, char => {
    return charsToReplace[char];
  });
};
