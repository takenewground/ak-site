
// // Progressive loading images
// const imagesToLoad = document.querySelectorAll('img[data-src]');
// const loadImages = (image) => {
//   image.setAttribute('src', image.getAttribute('data-src'));
//   image.onload = () => {
//     image.removeAttribute('data-src');
//   };
// };
// if ('IntersectionObserver' in window) {
//   const observer = new IntersectionObserver((items) => {
//     items.forEach((item) => {
//       if (item.isIntersecting) {
//         loadImages(item.target);
//         observer.unobserve(item.target);
//       }
//     });
//   });
//   imagesToLoad.forEach((img) => {
//     observer.observe(img);
//   });
// } else {
//   imagesToLoad.forEach((img) => {
//     loadImages(img);
//   });
// }



// // Setting up random Notification
// function randomNotification() {
//     const randomItem = Math.floor(Math.random() * games.length);
//     const notifTitle = games[randomItem].name;
//     const notifBody = `Created by ${games[randomItem].author}.`;
//     const notifImg = `data/img/${games[randomItem].slug}.jpg`;
//     const options = {
//       body: notifBody,
//       icon: notifImg,
//     };
//     new Notification(notifTitle, options);
//     setTimeout(randomNotification, 30000);
//   }


// Viewport size
const calcWinsize = () => {
    return { width: window.innerWidth, height: window.innerHeight };
};



// from https://dmitripavlutin.com/how-to-compare-objects-in-javascript/
const isObject = (object) => object != null && typeof object === 'object';
const deepEqual = (object1, object2) => {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);
    if (keys1.length !== keys2.length) {
        return false;
    }
    for (const key of keys1) {
        const val1 = object1[key];
        const val2 = object2[key];
        const areObjects = isObject(val1) && isObject(val2);
        if ( areObjects && !deepEqual(val1, val2) || !areObjects && val1 !== val2 ) {
            return false;
        }
    }
    return true;
}

export {
    clamp,
    map,
    calcWinsize,
    deepEqual
};