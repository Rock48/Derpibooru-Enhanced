// ==UserScript==
// @name         Derpibooru+
// @namespace    http://moonlightsoftware.net/
// @version      0.2.6
// @description  Adds some new features to derpibooru!
// @author       Charles "Rock48" Quigley
// @match        https://derpibooru.org/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let thumbs = document.querySelectorAll(".thumb, .thumb_small");

    document.querySelector('.block__header .flex__right').innerHTML = '<span id="slider-span">Scale:&nbsp;&nbsp;<input type="range" min="0.25" max="4" value="1" id="scale-range" step="0.05">&nbsp;&nbsp;<span id="tn-scale">1.00</span></span>' + document.querySelector('.block__header .flex__right').innerHTML;

    let current_scale = 1;
    let current_size = 150;

    document.styleSheets[0].addRule(".interaction--view-or-dl", "color:#4f95db");
    document.styleSheets[0].addRule(".column-layout__left", "width:404px");
    document.styleSheets[0].addRule(".block__content.js-resizable-media-container", "flex-wrap:wrap; justify-content: center; display:flex;");
    document.styleSheets[0].addRule(".media -box__header--small", "width:190px;!important;");
    document.styleSheets[0].addRule(".media-box__content--small", "width:190px;!important;");
    document.styleSheets[0].addRule(".interaction--view-or-dl:hover", "color:white; background-color:#4f95db");
    document.styleSheets[0].addRule("#scale-range", "position:relative;top: 5px;");

    function updateMediaBoxHeaders() {
        const media_boxes = document.querySelectorAll(".media-box");

        media_boxes.forEach(mbox => {
            const link_row = mbox.querySelector(".media-box__header--link-row");
            if (!link_row) return;
            const thumb = mbox.querySelector(".thumb, .thumb_small");
            if (!thumb) return;
            const img_data = thumb.dataset;
            const full_img_uri = JSON.parse(img_data.uris).full;
            link_row.innerHTML += `<a class="interaction--view-or-dl" data-image-id="${img_data.imageId}" href="${full_img_uri}" rel="nofollow"><i class="fa fa-eye" title="View"></i></a>`;
            link_row.innerHTML += `<a class="interaction--view-or-dl" data-image-id="${img_data.imageId}" href="${full_img_uri.replace("/img/view", "/img/download")}" rel="nofollow"><i class="fa fa-download" title="Download"></i></a>`;
        })
    }

    function onresize() {
        let media_boxes_content = document.querySelectorAll(".media-box__content:not(.media-box__content--small):not(.media-box__content--featured)");
        media_boxes_content.forEach(el => {
            let t = (+el.style.width.replace("px", "") || 150);
            current_size = t * current_scale;
            let media_element = el.querySelector("video, img");
            if (!media_element) return;
            media_element.style.width = el.style.width = el.style.height = el.parentNode.style.width = current_size + "px";
        });
        updateThumbs();
    }
    function scaleOnInput() {
        current_scale = +this.value || 1;
        document.querySelector("#tn-scale").innerText = current_scale.toFixed(2);
        window.dispatchEvent(new Event("resize"));
    }
    
    document.querySelector("#scale-range").oninput = scaleOnInput;
    // Make sure that this happens last using requstAnimationFrame
    window.addEventListener("resize", () => requestAnimationFrame(onresize));

    function calcThumnailSizeToUse(dataset) {
        const largest = dataset.width < dataset.height ? dataset.height : dataset.width;
        if (current_size <= 150) {
            return "thumb_small";
        } else if (current_size < 320) {
            return "small";
        } else if (current_size < 600) {
            return "medium";
        } else if (current_size < 1280) {
            return "large";
        } else {
            return "full";
        }
    }
    function updateThumbs() {
        thumbs.forEach(el => {
            el.style["max-width"] = el.style["max-height"] = "12800px";
            let picture, video_srcs;
            const dataset = JSON.parse(JSON.stringify(el.dataset));
            dataset.uris = JSON.parse(dataset.uris);
            const thumb_size = calcThumnailSizeToUse(dataset);
            if (picture = el.querySelector("picture")) {
                let media_element = picture.firstElementChild;
                media_element.src = dataset.uris[thumb_size];
                media_element.srcset = "";
                media_element.style['object-fit'] = 'contain';
            } else if (video_srcs = el.querySelectorAll("video source")) {
                const video_element = el.querySelector("video");
                let needs_to_load_new_src = false;
                video_srcs.forEach(media_element => {
                    let ext = media_element.type.replace("video/", "");
                    const new_src = dataset.uris[thumb_size].replace("webm", ext);
                    if(new_src != media_element.src) needs_to_load_new_src = true;
                    media_element.src = new_src;
                    media_element.style['object-fit'] = 'contain';
                });
                // Only reload the video if the source has changed
                if (needs_to_load_new_src && video_element) {
                    const cur_time = video_element.currentTime;
                    video_element.addEventListener("play", function () {
                        this.currentTime = cur_time > this.currentTime ? cur_time : this.currentTime;
                    }, { once: true });
                    video_element.load();
                }
            }
        })
    }
    setTimeout(scaleOnInput, 100);
    updateMediaBoxHeaders();
})();