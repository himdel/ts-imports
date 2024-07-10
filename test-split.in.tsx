import React from "react";
import { t } from "@lingui/macro";

import * as moment from "moment";
import { Button, Form as Borg, type FormGroup } from "@patternfly/react-core";

import React, { Component } from "react";

import { default as FormFieldHelper } from "../src/components";

import type Karel from "./karel";
import type { Lojza } from "node:path";

import "./foo.scss";

// just ensures we don't blow up on ts...
interface IProps {
  onCancel?: () => void;
  onSave?: (string) => void;
  group?: { name: string };
}

// ...or on new js syntax
function syntax(x) {
  x ||= 5;
  return <>x</>;
}
