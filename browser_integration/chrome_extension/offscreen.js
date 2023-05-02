/* Copyright 2022 Joel Baxter
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // "msg" is page content. See if it contains a redirect URL as a meta
  // refresh element. If so, respond with the URL. If not, respond with null.
  let parser = new DOMParser();
  const doc = parser.parseFromString(msg, "text/html");
  for (element of doc.getElementsByTagName("META")) {
    const attrs = element.attributes;
    const httpEquiv = attrs.getNamedItem("http-equiv")
    if ((httpEquiv !== null) && (httpEquiv.value.toLowerCase() === "refresh")) {
      const contentValue = attrs.getNamedItem("content");
      if (contentValue !== null) {
        const urlMarker = contentValue.value.indexOf('=');
        if (urlMarker !== -1) {
          redirectUrl = contentValue.value.substring(urlMarker + 1)
          sendResponse(redirectUrl);
          return;
        }
      }
    }
  }
  sendResponse(null);
});
