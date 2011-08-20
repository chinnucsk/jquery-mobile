/*
* jQuery Mobile Framework : history.pushState support, layered on top of hashchange
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*/
( function( $, window ) {
	// For now, let's Monkeypatch this onto the end of $.mobile._registerInternalEvents
	var pushStateHandler = self = {},
		oldRegisterInternalEvents = $.mobile._registerInternalEvents,
		$win = $( window );

	$.extend( pushStateHandler, {
		// TODO move to a path helper, this is rather common functionality
		initialFilePath: (function() {
			var url = $.mobile.path.parseUrl( location.href );

			return url.pathname + url.search;
		})(),

		// Begin with popstate listening disabled, since it fires at onload in chrome
		popListeningEnabled: false,

		// Flag for tracking if a Hashchange naturally occurs after each popstate + replace
		hashchangeFired: false,

		state: function() {
			return {
				hash: location.hash || "#" + self.initialFilePath,
				title: document.title,
				originalHref: self.initialFilePath
			};
		},

		onHashChange: function( e ) {
			var href, state;

			self.hashchangeFired = true;

			// only replaceState when pushState support is present and
			// the hash doesn't represent an embeded page
			if( $.support.pushState && $.mobile.path.isPath(location.hash) ) {

				// propulate the hash when its not available
				state = self.state();

				// make the hash abolute with the current href
				href = $.mobile.path.makeUrlAbsolute( state.hash.replace("#", ""), location.href );

				// replace the current url with the new href and store the state
				history.replaceState( state, document.title, href );
			}
		},

		onPopState: function( e ) {
			var poppedState = e.originalEvent.state;
			if( self.popListeningEnabled && poppedState ) {
				history.replaceState( poppedState, poppedState.title, poppedState.originalHref + poppedState.hash );

				// Urls that reference subpages will fire their own hashchange, so we don't want to trigger 2 in that case.
				self.hashchangeFired = false;

				setTimeout(function() {
					if( !self.hashchangeFired ) {
						$win.trigger( "hashchange" );
					}

					self.hashchangeFired = false;
				}, 0);
			}
		},

		init: function() {
			$win.bind( "hashchange", self.onHashChange );

			// Handle popstate events the occur through history changes
			$win.bind( "popstate", self.onPopState );

			// if there's no hash, we need to replacestate for returning to home
			if ( location.hash === "" ) {
				history.replaceState( self.state(), document.title, location.href );
			}

			// Enable pushstate listening *after window onload
			// To ignore the initial pop that Chrome calls at onload
			$win.load(function() {
				setTimeout(function() {
					self.popListeningEnabled = true;
				}, 0 );
			});
		}
	});

	$.mobile._registerInternalEvents = function(){
		// Call previous function
		oldRegisterInternalEvents();
		pushStateHandler.init();
	};
})( jQuery, this );