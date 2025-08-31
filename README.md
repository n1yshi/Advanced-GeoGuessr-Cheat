# Advanced GeoGuessr Cheats Extension

This is a userscript designed to enhance the GeoGuessr experience by providing real-time location assistance.  It displays an embedded map with the correct location and adds an optional overlay marker to the in-game map.

## Features and Functionality

*   **Real-time Coordinate Extraction:** Intercepts Google Street View API calls to determine the precise coordinates of the current location.
*   **Embedded Map:** Displays a draggable and resizable map showing the exact location. Uses OpenStreetMap for the map display.
*   **Overlay Marker:** Places a visual marker on the GeoGuessr map, indicating the extracted coordinates.
*   **Keyboard Shortcuts:**
    *   `1`: Toggle the embedded map visibility.
    *   `2`: Create the overlay marker.
    *   `3`: Remove the overlay marker.
    *   `4`: Open the location in Google Maps in a new tab.
    *   `5`: Copy the coordinates to the clipboard.
*   **Status Updates:** Provides informative messages via an on-screen status display, indicating the script's activity and potential issues.
*   **Cheat Detection Mitigation:** Attempts to remove potential cheat detection scripts from the page.
*   **Automatic Map Updates:** Periodically updates the overlay marker's position to keep it aligned with the in-game map, even when the user zooms or pans.
*   **Draggable Embedded Map:**  Allows the user to reposition the embedded map anywhere on the screen.

## Technology Stack

*   **JavaScript:** Core logic of the userscript.
*   **Tampermonkey/Greasemonkey:**  Userscript manager required to run the script.
*   **OpenStreetMap:** Used for displaying the embedded map.
*   **Google Maps API (Interception):** The script intercepts calls to Google's internal Maps API to extract location data.

## Prerequisites

*   A browser with a userscript manager installed (e.g., Tampermonkey for Chrome, Greasemonkey for Firefox).
*   An active internet connection.
*   A GeoGuessr account (for playing the game).

## Installation Instructions

1.  Install a userscript manager for your browser:
    *   **Chrome:** [Tampermonkey](https://www.tampermonkey.net/)
    *   **Firefox:** [Greasemonkey](https://www.greasespot.net/)
2.  Click on the following link to install the script directly from Greasy Fork: [Geoguessr Location Resolver (Overlay Only)](https://update.greasyfork.org/scripts/450253/Geoguessr%20Location%20Resolver%20%28Works%20in%20all%20modes%29.user.js)
3.  The userscript manager will prompt you to confirm the installation.  Click "Install".
4.  Open or refresh the GeoGuessr website ([https://www.geoguessr.com/\*](https://www.geoguessr.com/*)).

## Usage Guide

1.  Start a game on GeoGuessr.
2.  The script will automatically attempt to extract coordinates from the Google Street View API calls.
3.  An embedded map will appear in the top-left corner of the screen.  If it doesn't appear automatically, wait a few seconds.
4.  Use the keyboard shortcuts (1-5) to toggle the embedded map, create/remove the overlay marker, open the location in Google Maps, or copy the coordinates.
5.  The embedded map is draggable by its header; click and drag to reposition. You can also resize it using the "↔" button in the header.
6.  The status display at the top of the embedded map provides information on the script's activity.

## API Documentation

This script does not expose an external API. It functions by intercepting and analyzing internal API calls made by the GeoGuessr website.

## Contributing Guidelines

Contributions are welcome!  To contribute:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with clear, descriptive messages.
4.  Submit a pull request.

Please ensure your code adheres to the existing style and conventions.

## License Information

No license information was provided.  All rights are reserved by the author.

## Contact/Support Information

For issues, questions, or suggestions, please open an issue on the GitHub repository: [https://github.com/n1yshi/Advanced-GeoGuessr-Cheats-Extension-/issues](https://github.com/MasterM142/Advanced-GeoGuessr-Cheats-Extension-/issues)
