
(function(global) {

    'use strict';
         
    if (!global.MapProject) {
        global.MapProject = { };
    }
    
    if (global.MapProject.Icons) {
    geomap.warn('MapProject.ICON is already defined.');
    return;
    }

    MapProject.Icons={refLine:'<svg t="1619677851087" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="19960" width="12" height="12"><path d="M277.333333 1024c-11.797333 0-21.333333-9.557333-21.333333-21.333333L256 21.333333c0-11.776 9.536-21.333333 21.333333-21.333333s21.333333 9.557333 21.333333 21.333333l0 981.333333C298.666667 1014.442667 289.130667 1024 277.333333 1024z" p-id="19961"></path><path d="M512 1024c-11.797333 0-21.333333-9.557333-21.333333-21.333333L490.666667 21.333333c0-11.776 9.536-21.333333 21.333333-21.333333s21.333333 9.557333 21.333333 21.333333l0 981.333333C533.333333 1014.442667 523.797333 1024 512 1024z" p-id="19962"></path><path d="M746.666667 1024c-11.797333 0-21.333333-9.557333-21.333333-21.333333L725.333333 21.333333c0-11.776 9.536-21.333333 21.333333-21.333333s21.333333 9.557333 21.333333 21.333333l0 981.333333C768 1014.442667 758.464 1024 746.666667 1024z" p-id="19963"></path><path d="M1002.666667 298.666667 21.333333 298.666667c-11.797333 0-21.333333-9.557333-21.333333-21.333333s9.536-21.333333 21.333333-21.333333l981.333333 0c11.797333 0 21.333333 9.557333 21.333333 21.333333S1014.464 298.666667 1002.666667 298.666667z" p-id="19964"></path><path d="M1002.666667 533.333333 21.333333 533.333333c-11.797333 0-21.333333-9.557333-21.333333-21.333333s9.536-21.333333 21.333333-21.333333l981.333333 0c11.797333 0 21.333333 9.557333 21.333333 21.333333S1014.464 533.333333 1002.666667 533.333333z" p-id="19965"></path><path d="M1002.666667 768 21.333333 768c-11.797333 0-21.333333-9.557333-21.333333-21.333333s9.536-21.333333 21.333333-21.333333l981.333333 0c11.797333 0 21.333333 9.557333 21.333333 21.333333S1014.464 768 1002.666667 768z" p-id="19966"></path></svg>',
        layerInfo:'<svg t="1619426085418" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1848" width="12" height="12"><path d="M512 78.769231l433.230769 315.076923-433.230769 315.076923L78.769231 393.846154 512 78.769231z m352 492.307692L945.230769 630.153846 512 945.230769 78.769231 630.153846l81.230769-59.076923L512 827.076923l352-256z" fill="#333333" p-id="1849"></path></svg>',
        query:'<svg t="1619668960772" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1404" width="12" height="12"><path d="M654.1 608.9c20.4-24.7 37-52.1 49.5-81.7 17.3-40.9 26.1-84.4 26.1-129.1s-8.8-88.2-26.1-129.1c-16.7-39.5-40.6-75-71.1-105.4-30.5-30.5-65.9-54.4-105.4-71.1C486.2 75 442.8 66.2 398 66.2S309.8 75 268.8 92.3c-39.5 16.7-75 40.6-105.4 71.1-30.5 30.5-54.4 65.9-71.1 105.4-17.3 41-26.1 84.4-26.1 129.2s8.8 88.2 26.1 129.1c16.7 39.5 40.6 75 71.1 105.4 30.5 30.5 65.9 54.4 105.4 71.1 40.9 17.3 84.4 26.1 129.1 26.1s88.2-8.8 129.1-26.1c29.7-12.5 57-29.2 81.7-49.5l296.8 296.8 22.6-22.6 22.6-22.6-296.6-296.8zM665.8 398c0 147.6-120.1 267.8-267.8 267.8-147.6 0-267.8-120.1-267.8-267.8 0-147.6 120.1-267.8 267.8-267.8 147.6 0 267.8 120.1 267.8 267.8z" p-id="1405"></path></svg>',
        queryRect:'<svg t="1619669003834" class="icon" viewBox="0 0 1170 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1730" width="12" height="12"><path d="M550.4 268.8c155.52 0 281.6 126.08 281.6 281.6 0 63.9104-21.2992 122.8544-57.1776 170.112l103.3472 103.3472a38.4 38.4 0 0 1-52.4672 56.0384l-1.8432-1.728-103.3344-103.3472A280.3584 280.3584 0 0 1 550.4 832c-155.52 0-281.6-126.08-281.6-281.6s126.08-281.6 281.6-281.6z m0 76.8c-113.1136 0-204.8 91.6864-204.8 204.8s91.6864 204.8 204.8 204.8 204.8-91.6864 204.8-204.8-91.6864-204.8-204.8-204.8z" fill="#2c2c2c" p-id="1731"></path><path d="M806.4 0a89.6 89.6 0 0 1 89.5488 86.528L896 89.6v145.0624a38.4 38.4 0 0 1-76.736 2.2656L819.2 234.6624V89.6a12.8 12.8 0 0 0-11.3024-12.7104L806.4 76.8H89.6a12.8 12.8 0 0 0-12.7104 11.3024L76.8 89.6v716.8a12.8 12.8 0 0 0 11.3024 12.7104L89.6 819.2h120.2432a38.4 38.4 0 0 1 2.2528 76.736l-2.2528 0.064H89.6a89.6 89.6 0 0 1-89.5488-86.528L0 806.4V89.6a89.6 89.6 0 0 1 86.528-89.5488L89.6 0h716.8z" fill="#2c2c2c" p-id="1732"></path></svg>',
        query2:'<svg t="1619677276831" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3496" width="12" height="12"><path d="M910.1312 102.912h-195.4304a33.4336 33.4336 0 0 0 0 66.816h162.0992V331.776a33.4336 33.4336 0 0 0 66.816 0V136.192a33.536 33.536 0 0 0-33.4848-33.3824zM136.6528 365.1584c18.432 0 33.4336-15.0016 33.4336-33.3824V169.728h162.0992a33.4336 33.4336 0 0 0 0-66.8672H136.6528a33.4336 33.4336 0 0 0-33.3824 33.4336V331.776c0 18.432 14.848 33.3824 33.3824 33.3824z m195.4304 534.784H170.0864v-162.0992a33.4336 33.4336 0 0 0-66.816 0v195.5328c0 18.432 15.0016 33.4336 33.3824 33.4336h195.5328a33.4336 33.4336 0 1 0-0.1024-66.8672z m578.048-195.4816a33.4336 33.4336 0 0 0-33.4336 33.3824v162.0992H714.752a33.4336 33.4336 0 0 0 0 66.8672h195.5328c18.432 0 33.3824-15.0016 33.3824-33.4336v-195.5328a33.536 33.536 0 0 0-33.4848-33.3824z m-141.312 100.2496a33.3312 33.3312 0 0 0 23.04-57.6l-84.224-80.384a245.248 245.248 0 1 0-445.7472-156.16 245.3504 245.3504 0 0 0 400.3328 205.1584l83.5072 79.7184a33.28 33.28 0 0 0 23.0912 9.216z m-83.8656-267.6224a177.92 177.92 0 0 1-56.1664 119.1424 177.5616 177.5616 0 0 1-133.2736 47.8208 177.3056 177.3056 0 0 1-122.7776-60.1088 177.7664 177.7664 0 0 1-44.288-129.28 177.92 177.92 0 0 1 56.1664-119.1424 177.5616 177.5616 0 0 1 133.12-47.8208c47.6672 2.9696 91.1872 24.32 122.8288 60.16 31.6928 35.6864 47.4112 81.6128 44.3904 129.2288z" p-id="3497"></path></svg>',
        draw:'<svg t="1619677506373" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="13383" width="12" height="12"><path d="M942.654832 687.605483L519.250636 435.700243c-15.44783-9.18929-25.37697-2.171456-22.100344 15.59007l90.028433 487.136729c3.28379 17.756409 14.403035 20.215414 24.74252 5.442966 0 0 57.520041-82.45699 104.696504-132.795469l90.49813 134.79194c8.637728 12.8384 26.065655 16.188704 38.752606 7.466042l30.379915-20.999267c12.669554-8.740058 15.966647-26.434046 7.351431-39.299051l-90.458221-134.697795c60.47842-25.067932 145.927557-46.214555 145.927557-46.214555 17.426905-4.300956 19.038612-15.331173 3.585665-24.51637z" fill="" p-id="13384"></path><path d="M511.999488 887.554398l-0.290619 0.167822-324.629565-187.749058 0.288573-375.021255L512.290107 137.688919l324.629565 187.759291-0.185218 250.299673h64.100924l0.210801-287.259446L512.344343 63.671135 123.294582 287.893896l-0.342807 449.039039 388.702859 224.808093 0.344854-0.198522z" fill="" p-id="13385"></path></svg>'
    };
 
   

})(typeof exports !== 'undefined' ? exports : this);