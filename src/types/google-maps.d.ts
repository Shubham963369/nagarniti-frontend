declare namespace google.maps {
  namespace places {
    class AutocompleteService {
      getPlacePredictions(
        request: AutocompletionRequest,
        callback: (
          predictions: AutocompletePrediction[] | null,
          status: PlacesServiceStatus
        ) => void
      ): void;
    }

    class PlacesService {
      constructor(attrContainer: HTMLDivElement | google.maps.Map);
      getDetails(
        request: PlaceDetailsRequest,
        callback: (result: PlaceResult | null, status: PlacesServiceStatus) => void
      ): void;
    }

    interface AutocompletionRequest {
      input: string;
      componentRestrictions?: ComponentRestrictions;
      types?: string[];
    }

    interface ComponentRestrictions {
      country: string | string[];
    }

    interface AutocompletePrediction {
      place_id: string;
      description: string;
      structured_formatting?: {
        main_text: string;
        secondary_text: string;
      };
    }

    interface PlaceDetailsRequest {
      placeId: string;
      fields?: string[];
    }

    interface PlaceResult {
      geometry?: {
        location: LatLng;
      };
      formatted_address?: string;
      name?: string;
    }

    enum PlacesServiceStatus {
      OK = "OK",
      ZERO_RESULTS = "ZERO_RESULTS",
      ERROR = "ERROR",
      INVALID_REQUEST = "INVALID_REQUEST",
      OVER_QUERY_LIMIT = "OVER_QUERY_LIMIT",
      REQUEST_DENIED = "REQUEST_DENIED",
      UNKNOWN_ERROR = "UNKNOWN_ERROR",
      NOT_FOUND = "NOT_FOUND",
    }
  }

  class LatLng {
    lat(): number;
    lng(): number;
  }

  class Geocoder {
    geocode(
      request: GeocoderRequest,
      callback?: (results: GeocoderResult[] | null, status: GeocoderStatus) => void
    ): Promise<GeocoderResponse>;
  }

  interface GeocoderRequest {
    location?: { lat: number; lng: number };
    address?: string;
  }

  interface GeocoderResponse {
    results: GeocoderResult[];
  }

  interface GeocoderResult {
    formatted_address: string;
    geometry: {
      location: LatLng;
    };
  }

  enum GeocoderStatus {
    OK = "OK",
    ZERO_RESULTS = "ZERO_RESULTS",
    ERROR = "ERROR",
  }

  class Map {}
}

interface Window {
  google: typeof google;
}
