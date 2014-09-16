style.buckets.Counties = {
  "filter": {"source": "basemap", "layer": "Counties"},
  "fill": true
};

style.layers.push({
  "id": "Counties",
  "bucket": "Counties"
});

style.styles.default.Counties = {
  "fill-color": "#F1EFCF",
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
  "fill-color": "#dbebb0",
  "fill-opacity": {
    "fn": "stops",
    "stops": [[10, .5], [18, .9]]
  }
};

style.buckets.water = {
  "filter": {"source": "basemap", "layer": "Water Areas"},
  "fill": true
};

style.layers.push({
  "id": "water",
  "bucket": "water"
});

style.styles.default.water = {
  "fill-color": "#b5cfe6",
  "fill-opacity": {
    "fn": "stops",
    "stops": [[10, .5], [18, .9]]
  }
};

style.buckets.MajorBuildings = {
  "filter": {"source": "basemap", "layer": "MajorBuildings"},
  "fill": true
};

style.layers.push({
  "id": "MajorBuildings",
  "bucket": "MajorBuildings"
});

style.styles.default.MajorBuildings = {
  "fill-color": "#fafab8",
  "fill-opacity": {
    "fn": "stops",
    "stops": [[10, .5], [18, .9]]
  }
};


style.buckets.MediumBuildings = {
  "filter": {"source": "basemap", "layer": "MediumBuildings"},
  "fill": true
};

style.layers.push({
  "id": "MediumBuildings",
  "bucket": "MediumBuildings"
});

style.styles.default.MediumBuildings = {
  "fill-color": "#fafab8",
  "fill-opacity": {
    "fn": "stops",
    "stops": [[10, .5], [18, .9]]
  }
};

style.buckets.Buildings = {
  "filter": {"source": "basemap", "layer": "Buildings"},
  "fill": true
};

style.layers.push({
  "id": "Buildings",
  "bucket": "Buildings"
});

style.styles.default.Buildings = {
  "fill-color": "#fafab8",
  "fill-opacity": {
    "fn": "stops",
    "stops": [[10, .5], [18, .9]]
  }
};


style.buckets.roads = {
  "filter": {"source": "basemap", "layer": "Roads"},
  "line": true
};

style.layers.push({
  "id": "roads",
  "bucket": "roads"
});

style.styles.default.roads = {
  "line-color": "#999",
  "line-width": "1",
  "line-opacity": {
    "fn": "stops",
    "stops": [[11, 0], [17, 1]]
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

