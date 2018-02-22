var graph;
var urls;
var artistsSuggested;
var accessToken;

$(window).on("load", function (e) {

    var artistsArray;
    var searchRequest;
    getAccessToken();

    $('.btn').on("click", function (event) {

        event.preventDefault();
        $('.results').hide();
        $('.results p').empty();
        $(".creatingMap").show();
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

    function getAccessToken() {
        $.ajax(
            {
                type: 'GET',
                url: "http://localhost:8080/musicmapper/accesstoken"        
            
            })
            .then(data => {
                console.log(data)
                // accessToken = data.access_token;
                // console.log(accessToken)
            })
    }

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
            return $.ajax(
                {
                    type: 'GET',
                    url: "https://api.spotify.com/v1/artists/" + element.id + "/related-artists",
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                })
                .then(function success(data) {
                    inputArray.push(data);
                }, function fail(err) { });
        });
    };

    function returnArray(request) {
        return request.map(function (element) {
            var URL = "https://api.spotify.com/v1/search?q=";
            var searchArtistName = URL + element + "&type=artist";
            return $.ajax({
                type: 'GET',
                url: searchArtistName,
                headers: { Authorization: `Bearer ${accessToken}` }
            })
                .then(function (data) {
                    createArtistsArray(data);
                }, function fail(err) {
                });
        });
    };


    function buildInterArtistsRelationshipsMap() {
        var artistsRelatedArtists = [];
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
                        artistsSuggested.push(element);
                    }
                });
                var results = "<div>";


                var promises = [];
                promises = artistsSuggested.map(function (e, i) {
                    if (i < artistsSuggested.length) {
                        
                        console.log(e)
                        return new Promise ((resolve, reject) => {
                            $.ajax(
                            {
                                type: 'GET',
                                url: "https://api.spotify.com/v1/artists/" + e.artist.id + "/top-tracks",
                                headers: {
                                    Authorization: `Bearer ${accessToken}`
                                },
                                data: {
                                    "country": "US"
                                }
                            })
                            .then(data => {
                                console.log(data);
                                results += (
                                    '<div class="artistContainer">' + `<img src=${e.artist.images[2].url}>`
                                    + '<div class="infoContainer">'
                                    + `${e.artist.name}` + '<br/>' + `<a href=${e.artist.external_urls.spotify} target="_blank"> Artist Page </a>` + '<br/>' + 
                                    `<iframe src="https://open.spotify.com/embed?uri=${data.tracks[0].uri}" width="300" height="80" frameborder="1" allowtransparency="true"></iframe>` +
                                    '</div>' +
                                    '</div>' + '<br/>')
                                resolve(results);
                            })
                        });
                    }

                })
                Promise.all(promises)
                .then(results => {
                    console.log(results)
                    $('.results').append(results[results.length-1]);
                $('.results').show();
                })
                


                $('.creatingMap').hide();



            });
    };

});


