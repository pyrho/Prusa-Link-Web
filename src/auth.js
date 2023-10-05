// This file is part of the Prusa Link Web
// Copyright (C) 2021 Prusa Research a.s. - www.prusa3d.com
// SPDX-License-Identifier: GPL-3.0-or-later

import { modal } from "./printer/components/modal";
import { handleError } from "./printer/components/errors";

export const API_ROOT = window.location.pathname.endsWith("/")
  ? window.location.pathname.slice(0, -1)
  : window.location.pathname;

const createApiKey = (resolve) => {
  return (close) => {
    const template = document.getElementById(`modal-apiKey`);
    const node = document.importNode(template.content, true);

    const loginInput = node.getElementById("apiKey");
    loginInput.addEventListener("keydown", (event) => {
      if (event.key == "Enter") {
        close();
        resolve(event.target.value);
      }
    });

    const loginButton = node.getElementById("login");
    loginButton.addEventListener("click", (event) => {
      event.preventDefault();
      let apiKey = document.getElementById("apiKey").value;
      close();
      resolve(apiKey);
    });
    return node;
  };
};

/**
 * Show modal and ask the api key
 * @param {function} cb
 */
export const askApiKey = () => {
  if (localStorage.getItem("auth") === "true") return Promise.resolve();
  return new Promise((resolve, reject) => {
    modal(createApiKey(resolve), { timeout: 0, closeOutside: false });
  }).then((apiKey) => localStorage.setItem("apiKey", apiKey));
};

/**
 * Create the readers with apiKey if exist and Accept keys
 * @param {string?} accept Accept header, default is `application/json`
 */
const getHeaders = (accept = "application/json") => {
  if (localStorage.getItem("authType") == "ApiKey") {
    return {
      "X-Api-Key": localStorage.getItem("apiKey"),
      Accept: accept,
    };
  }
  return { Accept: accept, Authorization: localStorage.getItem("authHeader") };
};

/**
 * Authenticate the browser
 */
const setUpAuth = () =>
  askApiKey().then(
    () =>
      new Promise(async (resolve) => {
        localStorage.setItem("authType", "ApiKey");
        localStorage.setItem("auth", "pending");
        const endPoint = process.env.WITH_V1_API ? "/api/v1/info" : "/api/version";
        return fetch(`${API_ROOT}${endPoint}`, {
          headers: getHeaders(),
        })
          .then((response) => {
            const result = response.json();
            if (response.status != 200) {
              result.then((data) => handleError({ data }));
            }
            return result; // done
          })
          .then((data) => {
            localStorage.setItem("auth", "true");
            resolve(data);
          });
      }),
  );

/**
 * Async function for fetch url then call the callback with the data
 * @param {string} url
 * @param {object} opts
 */
const getJson = (url, opts = {}) => fetchUrl(url, opts, "application/json", "json");

/**
 * Async function for fetch url then call the callback with the data
 * @param {string} url
 * @param {object} opts
 */
const getPlainText = (url, opts = {}) => fetchUrl(url, opts, "text/plain", "text");

/**
 * Async function for fetch url then call the callback with the data
 * @param {string} url
 * @param {object} opts
 * @param {"application/json" | "text/plain" } accept Accept header
 * @param {"text" | "json"} parse Parse as text or json?
 */
async function fetchUrl(url, opts = {}, accept, parse) {
  const auth = localStorage.getItem("auth");
  if (auth == "true") {
    opts.headers = { ...opts.headers, ...getHeaders(accept) };
    const response = await fetch(`${API_ROOT}${url}`, opts);
    const status = response.status;
    const result = {
      code: status,
      eTag: response.headers.get("etag"),
    };

    switch (status) {
      case 401: // Unauthorized
        localStorage.setItem("auth", "false");
        throw result;
      case 204: // No Content
      case 304: // Not Modified
        return result;
      default:
        const text = await response.text();

        if (!response.ok) {
          if (text.length > 0) {
            try {
              result["data"] = JSON.parse(text);
            } catch {}
          }
          result["data"] = result["data"] || {
            title: `Error ${status}`,
            message: response.statusText,
          };
          throw result;
        }

        if (parse === "json") {
          result["data"] = text.length === 0 ? {} : JSON.parse(text);
        } else {
          result["data"] = text;
        }
        return result;
    }
  } else {
    throw { code: 401 };
  }
}

/**
 * Async function to get url to the file that request authentication
 * @param {string} url
 * @param {object} opts
 */
const getFileURL = (url, opts, timestamp) =>
  new Promise((resolve, reject) => {
    const auth = localStorage.getItem("auth");
    if (auth == "true") {
      opts.headers = { ...getHeaders(), ...opts.headers };
      fetch(timestamp ? `${API_ROOT}${url}?ct=${timestamp}` : url, opts)
        .then((response) => {
          if (response.status == 401) {
            localStorage.setItem("auth", "false");
            reject(response);
          }
          if (response.ok) {
            response.blob().then((blob) =>
              resolve({
                url: URL.createObjectURL(blob),
                headers: response.headers,
              }),
            );
          } else {
            reject(response);
          }
        })
        .catch((e) => reject(e));
    } else {
      reject();
    }
  });

/**
 * Async function for fetch image
 * @param {string} url
 */
const getImage = (url, timestamp, opts = {}) =>
  getFileURL(
    `${API_ROOT}${url}`,
    {
      ...opts,
      headers: {
        ...opts.headers,
        Accept: "image/*",
      },
    },
    timestamp,
  );

/**
 * Async function for fetch file
 * @param {string} url
 */
const getFile = (url) => getFileURL(url, {});

const createWelcome = (close) => {
  const template = document.getElementById(`modal-welcome`);
  const node = document.importNode(template.content, true);
  const closeButton = node.querySelector(".close-button");
  closeButton.addEventListener("click", close);
  return node;
};

const initAuth = () => {
  const showWelcome = localStorage.getItem("showWelcome");
  if (showWelcome == null) {
    return new Promise((resolve, reject) => {
      modal(createWelcome, {
        closeCallback: () => {
          localStorage.setItem("showWelcome", true);
          resolve();
        },
      });
    }).then(() => setUpAuth());
  } else {
    return setUpAuth();
  }
};

export { getJson, initAuth, getImage, getFile, getPlainText, getHeaders };
