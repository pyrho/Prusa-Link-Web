// This file is part of the Prusa Link Web
// Copyright (C) 2021 Prusa Research a.s. - www.prusa3d.com
// SPDX-License-Identifier: GPL-3.0-or-later

import { translateLabels } from "../../locale_provider";

export const init = (mp, maxTemp) => {
};

function mount() {
  const template = document.getElementById("live-feed-template");
  const node = document.importNode(template.content, true);
  document.getElementById("live-feed").appendChild(node);
  translateLabels("live-feed");
}

export function render() {
  const liveFeed = document.getElementById("live-feed");

  if (!liveFeed ) return;

  if (liveFeed.childElementCount == 0) mount();

}
