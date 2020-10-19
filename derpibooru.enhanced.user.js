// ==UserScript==
// @name         Derpibooru Enhanced
// @namespace    http://moonlightsoftware.net/
// @version      0.3.1
// @description  Adds some new features to derpibooru!
// @author       Charles "Rock48" Quigley
// @match        https://derpibooru.org/*
// @grant        none
// @updateURL    https://github.com/Rock48/Derpibooru-Enhanced/raw/master/derpibooru.enhanced.user.js
// ==/UserScript==

(function () {
    'use strict';

    // a friend added this function which didn't work for derpi
    // keeping it here but commented in his memory
    // const addCSSRuleOld = (() => {
    //         const style = document.createElement("style");
    //         style.appendChild(document.createTextNode(""));
    //         document.head.appendChild(style);
    //         return (
    //                 /**
    //                  * @param {string} selector
    //                  * @param {string[]} rules
    //                  */
    //                 function(selector, ...rules) {
    //                         style.sheet.addRule(selector, rules.join("; "));
    //                 }
    //         );
    // })();

    /**
     * Adds a CSS rule using the passed selector and rule list
     */
    function addCSSRule(selector, rules) {
        document.styleSheets[0].addRule(selector, rules);
    }

    const header = document.querySelector('.block__header');

    // Don't bother unless on a search page
    if(!header.querySelector('.block__header__title')) return;

    header.classList.add("flex");
    
    let header_right = header.querySelector('.flex__right');

    if(!header_right) {
        header_right = document.createElement("div");
        header_right.classList.add("flex__right");
        header.appendChild(header_right);
    }

    header_right.innerHTML = `<span id="slider-span">Scale:&nbsp;&nbsp;<input type="range" min="0.25" max="4" value="${localStorage.scale || 1}" id="scale-range" step="0.05">&nbsp;&nbsp;<span id="tn-scale">${(+localStorage.scale || 1).toFixed(2)}</span></span><span class="slider-pin"><i class="fa fa-thumbtack"></i></span>${header_right.innerHTML}`;


    let thumbs = document.querySelectorAll(".thumb, .thumb_small");
    let current_scale = +localStorage.scale || 1;
    let current_size = 150;

    addCSSRule(".inetaction-view-dl-view-or-newtab", "color:#4f95db");
    addCSSRule(".column-layout__left", "width:404px");
    addCSSRule(".block__content.js-resizable-media-container", "flex-wrap:wrap; justify-content: center; display:flex;");
    addCSSRule(".media -box__header--small", "width:190px;!important;");
    addCSSRule(".media-box__content--small", "width:190px;!important;");
    addCSSRule(".inetaction-view-dl-view-or-newtab:hover", "color:white; background-color:#4f95db");
    addCSSRule(".slider-fixed.snap-right", "right: 0 !important;");
    addCSSRule(".slider-fixed.smaller", "right: 126px");
    addCSSRule(".slider-fixed", "position:fixed !important; background-color: #2e3a52; z-index: 1000; top: 0px; right: 359.16px;");
    addCSSRule("#slider-span", "position:relative; display: inline-flex; height:32px; padding: 0 12px 0 12px;");
    addCSSRule(".slider-pin", "display: inline-flex; height:32px; padding: 0 12px 0 12px; cursor:pointer; color: transparent; -webkit-text-stroke: 1px white;");
    addCSSRule(".slider-pin i", "line-height: inherit;");
    addCSSRule(".slider-fixed.smaller", "right: 126px;");
    addCSSRule(".slider-fixed.snap-right + .slider-pin", "z-index: 1000; position: fixed; top: 0px; right: 248.3px;");
    addCSSRule(".slider-pin.clicked, .slider-pin:hover", "background: #253247;");
    addCSSRule(".slider-pin.clicked", "color: white; -webkit-text-stroke: none;");

    const slider_pin = document.querySelector(".slider-pin");
    const slider_span = document.querySelector("#slider-span");
    const scale_range = document.querySelector("#scale-range");

    slider_pin.addEventListener("click", function(e) {
        slider_pin.classList.toggle("clicked");
        if(localStorage.slider_pinned != "pinned") {
            localStorage.slider_pinned = "pinned"
        } else {
            localStorage.slider_pinned = "";
            slider_span.classList.remove("slider-fixed", "snap-right");
        }
    });
    if(localStorage.slider_pinned == "pinned") slider_pin.classList.add("clicked");
    
    function onScroll(e) {
        if(localStorage.slider_pinned != "pinned") return;

        if(scrollY >= slider_span.parentElement.offsetTop) {
            slider_span.classList.add("slider-fixed");
            if(window.innerWidth <= 1150) {
                slider_span.classList.add("smaller");
            }
        } else {
            slider_span.classList.remove("slider-fixed", "smaller");
        }
        
        if(scrollY >= slider_span.parentElement.offsetTop + slider_span.parentElement.clientHeight) {
            slider_span.classList.add("snap-right");
        } else {
            slider_span.classList.remove("snap-right");
        }
    }
    document.addEventListener("scroll", onScroll);
    onScroll();

    function updateMediaBoxHeaders() {
        const media_boxes = document.querySelectorAll(".media-box");

        media_boxes.forEach(mbox => {
            const link_row = mbox.querySelector(".media-box__header--link-row");
            if (!link_row) return;
            const thumb = mbox.querySelector(".thumb, .thumb_small");
            if (!thumb) return;
            const img_data = thumb.dataset;
            const full_img_uri = JSON.parse(img_data.uris).full;
            link_row.innerHTML += `<a class="inetaction-view-dl-view-or-newtab" data-image-id="${img_data.imageId}" href="${full_img_uri}" rel="nofollow" title="View"><i class="fa fa-eye"></i></a>`;
            link_row.innerHTML += `<a class="inetaction-view-dl-view-or-newtab" data-image-id="${img_data.imageId}" href="${full_img_uri.replace("/img/view", "/img/download")}" rel="nofollow" title="Download"><i class="fa fa-download"></i></a>`;
            link_row.innerHTML += `<a class="inetaction-view-dl-view-or-newtab" data-image-id="${img_data.imageId}" target="_blank" href="/images/${img_data.imageId}" rel="nofollow" title="New Tab"><i class="fa fa-arrow-right"></i></a>`;
            link_row.innerHTML += `<a class="inetaction-view-dl-view-or-newtab" data-image-id="${img_data.imageId}" target="_blank" href="${full_img_uri}" rel="nofollow" title="View (New Tab)"><i class="fa fa-eye"></i><i class="fa fa-arrow-right"></i></a>`;
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
        current_scale = +scale_range.value;
        localStorage.setItem("scale", current_scale);
        document.querySelector("#tn-scale").innerText = current_scale.toFixed(2);
        window.dispatchEvent(new Event("resize"));
    }
    
    scale_range.oninput = scaleOnInput;
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
                if(dataset.uris[thumb_size].match(/webm/) && !document.cookie.match("webm=true")) return;
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
    updateThumbs();
    updateMediaBoxHeaders();
})();
