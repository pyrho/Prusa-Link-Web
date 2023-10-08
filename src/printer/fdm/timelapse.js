// This file is part of the Prusa Link Web
// Copyright (C) 2021 Prusa Research a.s. - www.prusa3d.com
// SPDX-License-Identifier: GPL-3.0-or-later

import upload from "../components/upload";
import cameras from "../components/cameras";
import { translate } from "../../locale_provider";
import * as job from "../components/job";
import { getJson } from "../../auth";

const load = (context) => {
  translate("home.timelapses", { query: "#title-status-label" });
  update(context);
  const listOfTimelapses = document.getElementById("timelapses");
  getJson("/timelapses").then((results) => {
      console.dir(results)
    results.data.forEach((r) => {
      const template = document.getElementById("timelapse_grid_element");
      const node = document.importNode(template.content, true);
      const caption = node.getElementById("timelapse_name");
      caption.innerHTML = r.name;
      const img = node.getElementById("timelapse_thumbnail");
    const link = node.getElementById('timelapse_link')
        link.href = r.path
      img.src = `data:image/png;base64,${r.imgData}`
      listOfTimelapses.appendChild(node);
    });
  });
};

const update = (context) => {
  if (!context.printer) {
    return;
  }
  const linkState = context.state;

  job.update(context);
  upload.update(linkState);
  if (process.env["WITH_CAMERAS"]) {
    cameras.update(context, null);
  }
};

export default { load, update };
