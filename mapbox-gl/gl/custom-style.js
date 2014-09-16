style.buckets.Counties = {
  "filter": {"source": "basemap", "layer": "Counties"},
  "fill": true
};

style.layers.push({
  "id": "Counties",
  "bucket": "Counties"
});

style.styles.default.Counties = {
  "fill-color": "#039",
  "fill-opacity": {
    "fn": "stops",
    "stops": [[10, .5], [18, .9]]
  }
};

style.buckets.land = {
  "filter": {"source": "basemap", "layer": "Land\\Facility Areas"},
  "fill": true
};

style.layers.push({
  "id": "land",
  "bucket": "land"
});

style.styles.default.land = {
  "fill-color": "#0f5",
  "fill-opacity": {
    "fn": "stops",
    "stops": [[10, .5], [18, .9]]
  }
};


/*style.buckets.zipcodes = {
  "filter": {"source": "zipcodes", "layer": "tile"},
  "fill": true,
  "line": false
};

style.layers.push({
  "id": "zipcodes",
  "bucket": "zipcodes"
});

style.styles.default.zipcodes = {
  "fill-color": "#039",
  "stroke-color":"#eee",
  "line-width": 4,
  "fill-opacity": {
    "fn": "stops",
    "stops": [[4, .9], [10, .5]]
  }
};*/

