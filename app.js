var MOVIEDBAPI_URL = 'https://api.themoviedb.org/3';
var API_KEY = '33f92bf010f98be95b93866a815e0504';
var state = {
	items: [],
	imageConfig: [],
	currentItem: {}
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

var addSearchResults = function (data) {
	if(data.total_results !== 0) {
		data.results.forEach( function (item) {
			if(item.media_type === 'person') {
				getMoviesByActor(item.id, addMoviesByActor);
			}
			else {
				if(item.poster_path !== null) {
					state.items.push(item);
				}
				renderSearchResults(state);
			}
		});		
	}
	else {
		$('.js-no-results').html('<p>No results available for the given search.</p>');
	}	
};

var addMoviesByActor = function (data) {
	data.cast.forEach(function(pItem) {
		if(pItem.poster_path !== null) {
			state.items.push(pItem);
		}
	});
		renderSearchResults(state);

};

var addImageConfiguration = function (data) {
	if(data.images) {
		state.imageConfig = data.images;
	}
}; 

var addTrailertoInfo = function (data) {
	if(data.videos.results) {
		if(!state.currentItem.overview) {
			state.currentItem.overview = data.overview;
		}
		for( var i = 0; i < data.videos.results.length; i++ ) {
			if(data.videos.results[i].type === 'Trailer') {
				state.currentItem.trailer = data.videos.results[i];
				break;
			}
		}
	}
		renderMovieInfo(state.currentItem);
};

var clearState = function (state) {
	state.items = [];
	//state.imageConfig = [],
	state.currentItem = [];
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
		return state.imageConfig.secure_base_url + state.imageConfig.poster_sizes[size] + item.poster_path;
	}
	else {
		return 'images/defaultpic.png';
	}
};

var getImageSrcSet = function (state, item) {
	var srcSet = '';
	if (item.poster_path === null) {
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

var getBackdropSrc = function (state, item, size) {
	if(item.backdrop_path !== null) {
		return state.imageConfig.secure_base_url + state.imageConfig.backdrop_sizes[size] + item.backdrop_path;
	}
	else {
		return '';
	}
};

var getItemType = function (item) {
	if(item.media_type === 'movie') {
		return 'Movie';
	}
	else {
		return 'TV';
	}
};

var getReleaseDate = function (item) {
	if(item.release_date && item.release_date !== 'undefined') {
		return item.release_date;
	}
	else {
		return 'Unknown';
	}
};

var getRating = function (item) {
	if(item.vote_average) {
		return item.vote_average.toFixed(1);
	}
	else {
		return '0.0';
	}

}

var findItembyId = function (state, id) {
	for( var i = 0; i < state.items.length; i++ ) {
		if( state.items[i].id == id ) {
			
			return state.items[i];
		}
	}
};

var renderSearchResults = function (state) {
	var results = '';
	var i = 0;
	var prev = 0;
	if(state.items.length === 0) {
		$('.js-no-results').html('<p>No results available for the given search.</p>');
	}
	else
	{
		state.items.forEach(function(item) {
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
			if((i-1)%2 == 0) {
				results += '</div>';
			}
			i++;
		});
		$('.js-search-results').html(results);
	}
};

var renderMovieInfo = function (item) {
	$('.js-search').addClass('hidden');
	$('.js-movie-info').removeClass('hidden');
	$('.js-overview').html('');
	$('body').attr('style', 'background-image:linear-gradient(rgba(0, 0, 0, 0.5),rgba(0, 0, 0, 0.5)),url("'+getBackdropSrc(state, item, Math.floor(state.imageConfig.backdrop_sizes.length/2))+'")');

	$('.js-poster').attr('src', getImageSrc(state, item, Math.floor(state.imageConfig.poster_sizes.length/2)));
	$('.js-poster').attr('srcset', getImageSrcSet(state, item));
	$('.js-overview').append('<h2>' + getTitle(item) + '</h2>');
	if( item.overview ) {
		$('.js-overview').append('<h3>Overview</h3><p>' + item.overview + '</p>');
	}
	
	if(state.currentItem.trailer && state.currentItem.trailer.length !== 0) {
		$('.js-lightbox').attr('href', 'https://www.youtube.com/watch?v=' + state.currentItem.trailer.key);
		$('.js-lightbox').attr('data-lity', 'true');
		$('i').addClass('fa fa-youtube-play fa-2x');
	}
	else {
		$('.js-overview').append('<p>No trailers available.</p>');
		$('.js-lightbox').removeAttr('href');
		$('.js-lightbox').removeAttr('data-lity');
		$('i').removeClass('fa fa-youtube-play fa-2x');

	}
	
};

var submitSearchForm = function (event) {
	event.preventDefault();
	clearState(state);
	$('.js-no-results').html('');
	$('.js-search-results').html('');
	var query = $(this).find('.js-search-input').val();
	getSearchResultsFromAPI(query, addSearchResults);
};

var getItemInfo = function (event) {

	var currentId = $(event.target).closest('.js-result-item').attr('id');
	var currentItem = findItembyId(state, currentId);
	state.currentItem = currentItem;
	getTrailerFromID(currentItem, addTrailertoInfo);

};

$(function(){
	getImageConfiguration(addImageConfiguration);
});

$('.js-search-form').submit(submitSearchForm);

$('.js-search-results').on('click', '.js-result-item', getItemInfo);

$('.js-back').click(function(event) {
	event.preventDefault();
	$('body').attr('style', 'background-image:none');

	$('.js-search').removeClass('hidden');
	$('.js-movie-info').addClass('hidden');
	renderSearchResults(state);
});