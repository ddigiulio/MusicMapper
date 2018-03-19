var graph;
var urls;
var artistsSuggested;
var accessToken;

$(window).on("load", function (e) {

    var artistsArray;
    var searchRequest;
    getAccessToken();

    $('.btn').on("click", function (event) {
        $('.error').empty();
        event.preventDefault();
 
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
        if(searchRequest.length === 0 ){
            var error = "<span> You haven't entered any artists! </span>"
            $('.error').append(error);
        }
        
        else{
            var promiseArray = makePromiseArray(searchRequest);
            Promise.all(promiseArray)
            .then(buildInterArtistsRelationshipsMap);
        }
        
    
    });

    $('.newSearch').on("click", function(event){
        event.preventDefault();
       
        $('.results').empty();
        $('.results').hide();
        $("input").each(function () {
            $(this).val('')          
        });
        $('.newSearchContainer').hide();
        $('.container').show();
    })

    function getAccessToken() {
        $.ajax(
            {
                type: 'GET',
                url: "https://music-mapper.herokuapp.com/accesstoken"

            })
            .then(data => {
                console.log(data)
                accessToken = data

            })
    }

    function createArtistsArray(data) {
        if (data === null) {
            console.log("no related artists")
        }
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
                results += `<div class="title"><p> Because you like `;
                artistsArray.forEach( function(e, i) {
                    
                    if( artistsArray.length === 1){
                        return results+= `${e.name}`
                    }
                    else if(artistsArray.length === 2 && i===0){
                        results += `${e.name} `
                    }
                    else if( i === artistsArray.length-1){
                       
                        results += `and ${e.name},`
                    }
                    else {
                        results += `${e.name}, `
                    }
                })
                results += ` you should check out these artists: </p></div>`
                var promises = [];
                promises = artistsSuggested.map(function (e, i) {
                    if (i < artistsSuggested.length) {


                        return new Promise((resolve, reject) => {
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

                                    results += (
                                        '<div class="artistContainer">' + `<div class="artistImage"><img src=${e.artist.images[2].url} height="160" width="160"></div>`
                                        + '<div class="infoContainer">'
                                        + `<a href=${e.artist.external_urls.spotify} target="_blank"> ${e.artist.name} </a>` + '<br/>' +
                                        `<div class="song"><iframe src="https://open.spotify.com/embed?uri=${data.tracks[0].uri}" width="300" height="80" frameborder="0" allowtransparency="true"></iframe></div>` +
                                        '</div>' +
                                        '</div>' + '<br/>')
                                    resolve(results);
                                })
                        });
                    }

                })
                Promise.all(promises)
                    .then(results => {
                        $('.container').hide();
                        $('.results').append(results[results.length - 1]);
                        $('.results').show();
                        $('.newSearchContainer').show();
                    })


            });
    };

});


