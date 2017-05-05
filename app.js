var MOVIEDBAPI_URL = 'https://api.themoviedb.org/3';
var API_KEY = '33f92bf010f98be95b93866a815e0504';
var state = {
	items: [],
	imageConfig: [],
	currentTrailer: [],
	currentItem: []
};

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

var getTrailerFromID = function (item, callback) {
	var settings = {
		url: MOVIEDBAPI_URL + '/' + item.media_type + '/' + item.id + '/videos',
		data: {
			api_key: API_KEY
		},
		datatype: 'json',
		type: 'GET',
		success: callback
	};
	$.ajax(settings);
};

var addSearchResults = function (data) {
	if(data.total_results !== 0) {
		data.results.forEach( function (item) {
			if(item.media_type === 'person') {
				getMoviesByActor(item.id, addMoviesByActor);
			}
			else {
				state.items.push(item);
					renderSearchResults(state);
			}
		});		
	}
	else {
		$('.js-search-results').html('<p>No results available for the given search.</p>');
	}	
};

var addMoviesByActor = function (data) {
	data.cast.forEach(function(pItem) {
		state.items.push(pItem);
	});
		renderSearchResults(state);

};

var addImageConfiguration = function (data) {
	if(data.images) {
		state.imageConfig = data.images;
	}
}; 

var addTrailertoInfo = function (data) {
	if(data.results) {
		for( var i = 0; i < data.results.length; i++ ) {
			if(data.results[i].type === 'Trailer') {
				state.currentTrailer = data.results[i];
				break;
			}
		}
	}
		renderMovieInfo(state.currentItem);
};


var getTitle = function (item) {
	if(item.title) {
		return item.title;
	}
	else {
		return item.name;
	}
};

var getImageSrc = function (state, item, size) {
	if(item.poster_path !== null) {
		//return 'https://image.tmdb.org/t/p/w185_and_h278_bestv2/' + item.poster_path ;
		return state.imageConfig.secure_base_url + state.imageConfig.poster_sizes[size] + item.poster_path;
	}
	else {
		return 'images/defaultpic.png';
	}
};



var findItembyId = function (state, id) {
	for( var i = 0; i < state.items.length; i++ ) {
		if( state.items[i].id == id ) {
			
			return state.items[i];
		}
	}
};

var renderSearchResults = function (state) {
	var results = ''
	state.items.forEach(function(item) {
		results += '<div class="js-result-item" id="' + item.id +'" >' +
				'<img src="' + getImageSrc(state, item, 0) + '">' +
				'<h2>' + getTitle(item) + ' (' + item.media_type + ')</h2></div>';
	});
	$('.js-search-results').html(results);
};

var renderMovieInfo = function (item) {
	//if(state.currentTrailer === []){
		$('.js-poster').attr('src', getImageSrc(state, item, Math.floor(state.imageConfig.poster_sizes.length/2)));
	//}
	//else {
		$('.js-lightbox').attr('href', 'https://www.youtube.com/watch?v='+state.currentTrailer.key);
	//}
	$('.js-overview').find('h2').text(getTitle(item))
	$('.js-overview').find('p').text(item.overview);
};

var submitSearchForm = function (event) {
	event.preventDefault();
	var query = $(this).find('.js-search-input').val();
	getImageConfiguration(addImageConfiguration);
	getSearchResultsFromAPI(query, addSearchResults);
};

var getItemInfo = function (event) {
	$('.js-search').addClass('hidden');
	$('.js-movie-info').removeClass('hidden');
	var currentId = $(event.target).closest('.js-result-item').attr('id');
	var currentItem = findItembyId(state, currentId);
	state.currentItem = currentItem;
	getTrailerFromID(currentItem, addTrailertoInfo);

};

$('.js-search-form').submit(submitSearchForm);

$('.js-search-results').on('click', '.js-result-item', getItemInfo);