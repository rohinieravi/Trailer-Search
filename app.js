//Constants
var MOVIEDBAPI_URL = 'https://api.themoviedb.org/3';
var API_KEY = '33f92bf010f98be95b93866a815e0504';
//State object
var state = {
	items: [],
	imageConfig: [],
	currentItem: {}
};

/*AJAX call to API to fetch movie or tv results based on search item*/
var getSearchResultsFromAPI = function (searchItem, callback) {
	var settings = {
		url: MOVIEDBAPI_URL + '/search/multi',
		data: {
			api_key: API_KEY,
			query: searchItem
		},
		datatype: 'json',
		type: 'GET',
		success: callback
	};
	$.ajax(settings);
};

/*AJAX call to API to fetch movies or tv results by actor id */
var getMoviesByActor = function (personId, callback) {
	var settings = {
		url: MOVIEDBAPI_URL + '/person/' + personId + '/combined_credits',
		data: {
			api_key: API_KEY
		},
		datatype: 'json',
		type: 'GET',
		success: callback
	};
	$.ajax(settings);
};

/*AJAX call to API to fetch configuration for images*/
var getImageConfiguration = function (callback) {
	var settings = {
		url: MOVIEDBAPI_URL + '/configuration',
		data: {
			api_key: API_KEY
		},
		datatype: 'json',
		type: 'GET',
		success: callback
	};
	$.ajax(settings);
};

/*AJAX call to API to get videos from movie or tv id*/
var getTrailerFromID = function (item, callback) {
	var settings = {
		url: MOVIEDBAPI_URL + '/' + item.media_type + '/' + item.id,
		data: {
			api_key: API_KEY,
			append_to_response: 'videos'
		},
		datatype: 'json',
		type: 'GET',
		success: callback
	};
	$.ajax(settings);
};

/*Callback for getSearchResultsFromAPI, which adds results to state object and renders results if search item entered is a movie or TV show. If search item is an actor, it invokes the getMoviesByActor AJAX call.*/
var addSearchResults = function (data) {
	if( data.total_results !== 0 ) {
		data.results.forEach( function (item) {
			if( item.media_type === 'person' ) {
				getMoviesByActor(item.id, addMoviesByActor);
			}
			else {
				if( item.poster_path !== null ) {
					state.items.push(item);
				}
				if(state.items.length !== 0){
					renderSearchResults(state);
				}
			}
		});		
	}
	else {
		$('.js-no-results').html('<p>No results available for the given search.</p>');
	}	
};

/*Callback for getMoviesByActor, which adds the results to state object and renders results if search item is an actor*/
var addMoviesByActor = function (data) {
	data.cast.forEach( function (pItem) {
		if( pItem.poster_path !== null ) {
			state.items.push(pItem);
		}
	});
		renderSearchResults(state);

};

/*Callback for getImageConfiguration, which adds the image configuration to the state object*/
var addImageConfiguration = function (data) {
	if( data.images ) {
		state.imageConfig = data.images;
	}
}; 

/*Callback for getTrailerFromID, which adds the trailer and overview of the selected item to state object and renders the movie information and trailer*/
var addTrailertoInfo = function (data) {
	if( data.videos.results ) {
		if( !state.currentItem.overview ) {
			state.currentItem.overview = data.overview;
		}
		for( var i = 0; i < data.videos.results.length; i++ ) {
			if( data.videos.results[i].type === 'Trailer' ) {
				state.currentItem.trailer = data.videos.results[i];
				break;
			}
		}
	}
	renderMovieInfo(state.currentItem);
};

/*Clears the state object before a new search is initiated*/
var clearState = function (state) {
	state.items = [];
	state.currentItem = [];
};

/*Fetches the title for the movie or TV show based on the item passed*/
var getTitle = function (item) {
	if( item.title ) {
		return item.title;
	}
	else {
		return item.name;
	}
};

/*Fetches the complete url for accessing the poster image to set as value of src attribute of img tag for a particular item*/
var getImageSrc = function (state, item, size) {
	if( item.poster_path !== null ) {
		return state.imageConfig.secure_base_url + state.imageConfig.poster_sizes[size] + item.poster_path;
	}
	else {
		return 'images/defaultpic.png';
	}
};

/*Fetches the srcset attribute for the img tag from the different poster sizes stored in state for a particular item*/
var getImageSrcSet = function (state, item) {
	var srcSet = '';
	if ( item.poster_path === null ) {
		return srcSet;
	}
	for ( var i = 0; i < state.imageConfig.poster_sizes.length-2; i++ ) {
		if ( i !== 0 ) {
			srcSet += ', ';
		}
		srcSet += state.imageConfig.secure_base_url + state.imageConfig.poster_sizes[i] + item.poster_path + ' ' + 
		state.imageConfig.poster_sizes[i].slice(1) + 'w';
	}
	return srcSet;
};

/*Fetches the complete url for accessing the backdrop image to set as value of src attribute of img tag for a particular item*/
var getBackdropSrc = function (state, item, size) {
	if( item.backdrop_path !== null ) {
		return state.imageConfig.secure_base_url + state.imageConfig.backdrop_sizes[size] + item.backdrop_path;
	}
	else {
		return '';
	}
};

/*Returns appropriate media type of a particular item, i.e, Movie or TV*/
var getItemType = function (item) {
	if( item.media_type === 'movie' ) {
		return 'Movie';
	}
	else {
		return 'TV';
	}
};

/*Returns the release date of the item. If not available, returns 'Unknown'*/
var getReleaseDate = function (item) {
	if( item.release_date && item.release_date !== 'undefined' ) {
		return item.release_date;
	}
	else {
		return 'Unknown';
	}
};

/*Returns the rating of an item. If not avaible, return 0.0 .*/
var getRating = function (item) {
	if( item.vote_average ) {
		return item.vote_average.toFixed(1);
	}
	else {
		return '0.0';
	}
}

/*Returns an item from state object's items, matched by the id passed*/
var findItembyId = function (state, id) {
	for( var i = 0; i < state.items.length; i++ ) {
		if( state.items[i].id == id ) {
			return state.items[i];
		}
	}
};

/*Fetches the search results stored in state object and displays to user in a grid form*/
var renderSearchResults = function (state) {
	var results = '';
	var i = 0;
	var prev = 0;

	if( state.items.length === 0 ) {
		$('.js-no-results').html('<p>No results available for the given search.</p>');
	}
	else
	{
		state.items.forEach( function (item) {
			//adding responsive grid
			if(i%2 == 0) {
				results += '<div class="row">';
			}
			results += '<div class="col-6"><a href="#"><div class="js-result-item" id="' + item.id +'" >' +
					'<img src="' + getImageSrc(state, item, 0) + '" sizes="10vw" srcSet="' + getImageSrcSet(state, item) + '" alt="">' +
					'<div class="info"><h2>' + getTitle(item) + '</h2>' +
					'<p>Type: ' + getItemType(item) + '</p>' +
					'<p>Release Date: '+ getReleaseDate(item) +'</p>' +
					'<p>Rating: ' + getRating(item) +'</p></div>' +
					'</div></a></div>';
			if( (i-1)%2 == 0 ) {
				results += '</div>';
			}
			i++;
		});
		$('.js-search-results').html(results);
	}
};

/*Fetches the movie information and trailer stored in state object and displays it to user*/
var renderMovieInfo = function (item) {
	$('.js-search').addClass('hidden');
	$('.js-movie-info').removeClass('hidden');
	$('.js-overview').html('');
	//adding backdrop
	$('body').attr('style', 'background-image:linear-gradient(rgba(0, 0, 0, 0.5),rgba(0, 0, 0, 0.5)),url("'+getBackdropSrc(state, item, Math.floor(state.imageConfig.backdrop_sizes.length/2))+'")');
	$('.js-poster').attr('src', getImageSrc(state, item, Math.floor(state.imageConfig.poster_sizes.length/2)));
	$('.js-poster').attr('srcset', getImageSrcSet(state, item));
	$('.js-overview').append('<h2>' + getTitle(item) + '</h2>');

	if( item.overview ) {
		$('.js-overview').append('<h3>Overview</h3><p>' + item.overview + '</p>');
	}
	
	if( state.currentItem.trailer && state.currentItem.trailer.length !== 0 ) {
		$('.js-lightbox').attr('href', 'https://www.youtube.com/watch?v=' + state.currentItem.trailer.key);
		$('.js-lightbox').attr('data-lity', 'true');
		$('i').addClass('fa fa-youtube-play fa-3x');
	}
	else {
		$('.js-overview').append('<p>No trailers available.</p>');
		$('.js-lightbox').removeAttr('href');
		$('.js-lightbox').removeAttr('data-lity');
		$('i').removeClass('fa fa-youtube-play fa-3x');
	}
};

/*Event handler when search form is submitted, which invokes AJAX call getSearchResultsFromAPI based on search input*/
var submitSearchForm = function (event) {
	event.preventDefault();
	clearState(state);
	$('.js-no-results').html('');
	$('.js-search-results').html('');
	var query = $(this).find('.js-search-input').val();
	getSearchResultsFromAPI(query, addSearchResults);
};

/*Event handler when a result item is selected, which invokes AJAX call getTrailerFromID based on item clicked*/
var getItemInfo = function (event) {
	var currentId = $(event.target).closest('.js-result-item').attr('id');
	var currentItem = findItembyId(state, currentId);
	state.currentItem = currentItem;
	getTrailerFromID(currentItem, addTrailertoInfo);

};

/*Invokes the AJAX call getImageConfiguration to get image configuration on page load*/
$( function() {
	getImageConfiguration(addImageConfiguration);
});

/*Event listener for the search form*/
$('.js-search-form').submit(submitSearchForm);

/*Event listener when a result item is clicked*/
$('.js-search-results').on('click', '.js-result-item', getItemInfo);

/*Event lisener and handler when back is clicked from movie info page to return back to search results*/
$('.js-back').click( function (event) {
	event.preventDefault();
	$('body').attr('style', 'background-image:none');
	$('.js-search').removeClass('hidden');
	$('.js-movie-info').addClass('hidden');
	renderSearchResults(state);
});