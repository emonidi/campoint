$.fn.openMap = function (options) {
    var map,
        selectWrapper,
        searchResults,
        searchButton,
        searchBaseUrl = 'https://nominatim.openstreetmap.org/search?format=json&q=',
        documentFragment,
        self = this,
        onLocationAddedCallback,
        locations = []

    this.init = function () {
        this.createMap();
        this.createSearchBox();
        documentFragment = $(document.createDocumentFragment());
    }

    this.createMap = function () {
        this.addClass('open-map-plugin');
        map = new ol.Map({
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            target: 'map',
            controls: ol.control.defaults({
                attributionOptions: ({
                    collapsible: false
                })
            }),
            view: new ol.View({
                center: [23, 10],
                zoom: 2
            }),
            keyboardEventTarget: $(document)[0]
        });
    }

    this.createSearchBox = function () {
        var timeout;
        selectWrapper = this.append('' +
            '<div class="input-wrapper">' +
            '<div class="search-box">' +
            '<input type="text"/>' +
            '<span class="search glyphicon glyphicon-search"></span>' +
            '</div>' +
            '<ul class="search-results hidden"><li><a href="#">This is my result</a></li></ul>' +
            '</div>')

        searchResults = selectWrapper.find('.search-results');

        selectWrapper.find('input').on('keyup', function (ev) {
            var query = this.value
            if (query !== '' && query.length > 3) {
                if (timeout) clearTimeout(timeout);
                timeout = setTimeout(function () {
                    search(query);
                }, 600);
            } else if (query.length < 3) {
                searchResults.addClass('hidden');
            }
        });

        searchButton = selectWrapper.find('.search')
    }

    function search(query) {
        $.get(searchBaseUrl.concat(query)).then(function (res) {
            if (res.length > 0) {
                populateSelect(res);
            } else {
                hideSearchResults();
            }
        })
    }

    function hideSearchResults() {
        searchResults.html('').addClass('hidden');
    }

    function populateSelect(items) {
        documentFragment.empty();
        searchResults.empty();
        items.forEach(function (item) {
            documentFragment
                .append('<li>' +
                    '<a data-place-id="' + item.place_id + '" href="#">' + item.display_name + '</a>'
                    + '</li>')
        });

        searchResults.append(documentFragment.children()).removeClass('hidden');
        $(".search").off('click').on('click', function () {
            var firstItemId = $(searchResults.find('li a')[0]).data('placeId')
            var location = findItemByLocationId(items, firstItemId);
            console.log(location)
            self.centerMap([location.lon, location.lat]);
            addLocation(location)
            hideSearchResults();
        });
        setOnResultClicked(items);
    }

    function setOnResultClicked(items) {
        searchResults.find('a').on('click', function (ev) {
            var location = findItemByLocationId(items, $(this).data('placeId'));
            self.centerMap([location.lon, location.lat])
            addLocation(location);
            hideSearchResults();
        });
    }

    function addLocation(location) {
        locations.push(location);
        onLocationAddedCallback(locations);
    }

    this.centerMap = function (locationLonLat) {
        var center = ol.proj.transform([parseFloat(locationLonLat[0]), parseFloat(locationLonLat[1])], 'EPSG:4326', 'EPSG:3857');
        map.setView(new ol.View({
            center: center,
            zoom: 10
        }));

        setPin(locationLonLat)
    }

    function findItemByLocationId(items, locationId) {
        return items.filter(function (item) {
            if (item.place_id.toString() === locationId.toString()) {
                return item;
            }
        })[0];
    }

    function setPin(locationLonLat) {
        map.addOverlay(new ol.Overlay({
            position: ol.proj.transform(
                [parseFloat(locationLonLat[0]), parseFloat(locationLonLat[1])],
                'EPSG:4326',
                'EPSG:3857'
            ),
            offset:[-20,-40],
            element: $('<img src="../img/location_map_pin_light_blue6.png" style="width:40px;">')[0]
        }));
    }

    this.onLocationAdded = function (cb) {
        onLocationAddedCallback = cb;
    }

    this.init();

    return this;
}
