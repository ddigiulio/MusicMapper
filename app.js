var graph;
var urls;
var artistsSuggested;

$(window).on("load", function (e) {

    var artistsArray;

    var searchRequest;
    $('.btn').on("click", function (event) {

        event.preventDefault();
        $(".creatingMap").show();
        $("#graph-container").empty();
        searchRequest = [];
        artistsArray = [];
        graph = {
            nodes: [],
            edges: []
        };
        urls = [];
        artistsSuggested = [];
        $("input").each(function () {
            if ($(this).val().length != 0) {
                searchRequest.push($(this).val());
            }
        });

        var promiseArray = makePromiseArray(searchRequest);
        Promise.all(promiseArray)
            .then(buildInterArtistsRelationshipsMap);
        $("#graph").show();

    });

    function createArtistsArray(data) {
        var artistToAdd;
        artistToAdd = data.artists.items[0];
        urls.push(artistToAdd.images[0].url);
        artistsArray.push(artistToAdd);
    };

    function makePromiseArray(request) {
        return differentiateBetweenType(request);
    };

    function differentiateBetweenType(request) {
        var request = request;
        var requestType = (typeof request[0]);
        if (requestType === "string") {
            return returnArray(request);
        }
        else return findRelatedArtistsAll(request);

    };

    function findRelatedArtistsAll(inputArray) {
        return artistsArray.map(function (element) {
            return $.get("https://api.spotify.com/v1/artists/" + element.id + "/related-artists")
                .then(function success(data) {
                    inputArray.push(data);
                }, function fail(err) {});
        });
    };

    function returnArray(request) {
        return request.map(function (element) {
            var URL = "https://api.spotify.com/v1/search?q=";
            var searchArtistName = URL + element + "&type=artist";
            return $.get(searchArtistName)
                .then(function (data) {
                    createArtistsArray(data);
                }, function fail(err) {
                });
        });
    };


    function buildInterArtistsRelationshipsMap() {
        var artistsRelatedArtists = [];
        //console.log(artistsArray);
        artistsArray.forEach(function (element, i) {
            graph.nodes.push({
                id: 'a' + i,
                label: element.name,
                type: 'image',
                url: urls[i],
                x: Math.random(),
                y: Math.random(),
                size: 32,
                color: '#FF0000',

            });

        });

        var promiseArrayTwo = makePromiseArray(artistsRelatedArtists);
        Promise.all(promiseArrayTwo)
            .then(function (data) {
                var artistsContained = [];
                var artistsQuickCheck = [];
                var artistsDupCheck = artistsArray.map(function (e) {
                    return e.id;
                });

                var indexCurrent = 0;
                artistsRelatedArtists.forEach(function (element) {
                    element.artists.forEach(function (relatedArtist) {
                        if (artistsDupCheck.includes(relatedArtist.id)) {

                            return;
                        }
                        else if (!artistsQuickCheck.includes(relatedArtist.id)) {
                            artistsQuickCheck.push(relatedArtist.id);
                            artistsContained.push({ artist: relatedArtist, locations: [indexCurrent] });
                            urls.push(relatedArtist.images[0].url);

                        }
                        else {
                            var finder = artistsQuickCheck.indexOf(relatedArtist.id);
                            artistsContained[finder].locations.push(indexCurrent);

                        }
                    });
                    indexCurrent++;
                });

                artistsContained.sort(function (a, b) {
                    return (b.locations.length - a.locations.length)
                });

                artistsContained.forEach(function (element, i) {

                    if (artistsSuggested.length < 5) {
                        artistsSuggested.push(element.artist.name);
                    }

                    graph.nodes.push({
                        id: 'b' + i,
                        label: element.artist.name,
                        type: 'image',
                        url: urls[i + artistsArray.length],
                        x: Math.random(),
                        y: Math.random(),
                        size: 40 / artistsArray.length,


                    });
                    element.locations.forEach(function (locus, j) {

                        graph.edges.push({
                            id: element.artist.name + j,
                            source: 'b' + i,
                            target: 'a' + locus,
                            size: .5,
                            color: '#250001',
                            type: 'curvedArrow',

                        });

                    });
                });
                var results = "<p>";

                artistsSuggested.forEach(function (e, i) {
                    if (i < artistsSuggested.length - 1) {
                        results += e + ", "
                    }
                    else results += e + "<p>";

                });            
                $('.results').append(results);
                renderGraph(graph, urls);

            });
    };

});


