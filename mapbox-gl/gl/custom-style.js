style.buckets.zipcodes = {
  "filter": {"source": "zipcodes", "layer": "tile"},
  "fill": true
};

style.layers.push({
  "id": "zipcodes",
  "bucket": "zipcodes"
});

style.styles.default.zipcodes = {
  "fill-color": "#039",
  "stroke-color":"#eee",
  "fill-opacity": {
    "fn": "stops",
    "stops": [[4, .9], [10, .5]]
  }
};

