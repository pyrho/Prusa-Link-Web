// This file is part of the Prusa Link Web
// Copyright (C) 2021 Prusa Research a.s. - www.prusa3d.com
// SPDX-License-Identifier: GPL-3.0-or-later

import upload from "../components/upload";
import cameras from "../components/cameras";
import { translate } from "../../locale_provider";
import * as job from "../components/job";
import { LinkState } from "../../state";
import { getJson } from "../../auth";
import fdm from ".";
import { getStatusForTitle } from "../common";

const load = (context) => {
  translate("home.timelapses", { query: "#title-status-label" });
  update(context);
  const test = document.getElementById("test-hi");
    test.innerHTML = +new Date()
};

const update = (context) => {
  
  if (!context.printer) {
    return;
  }
  const linkState = context.state;

  job.update(context);
  upload.update(linkState);
  if (process.env['WITH_CAMERAS']) {
    cameras.update(context, null);
  }
};

export default { load, update };
