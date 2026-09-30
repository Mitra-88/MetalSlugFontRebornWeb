// Icon glyph data copied from the lucide package v1.49.0 (ISC License, (c) Lucide Contributors).
import { Dynamic } from "@solidjs/web";
import { For } from "solid-js";
import { merge } from "solid-js";

export type IconNode = [tag: string, attrs: Record<string, string>];

export interface IconProps {
  size?: number;
  class?: string;
}

function Icon(props: IconProps, node: IconNode) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 24}
      height={props.size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
      aria-hidden="true"
    >
      <For each={node}>{([tag, attrs]) => <Dynamic component={tag} {...attrs} />}</For>
    </svg>
  );
}

const activityNode: IconNode[] = [["path",{"d":"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"}]];

export function Activity(props: IconProps) {
  return Icon(props, activityNode);
}

const arrowleftNode: IconNode[] = [["path",{"d":"m12 19-7-7 7-7"}],["path",{"d":"M19 12H5"}]];

export function ArrowLeft(props: IconProps) {
  return Icon(props, arrowleftNode);
}

const checkNode: IconNode[] = [["path",{"d":"M20 6 9 17l-5-5"}]];

export function Check(props: IconProps) {
  return Icon(props, checkNode);
}

const chevrondownNode: IconNode[] = [["path",{"d":"m6 9 6 6 6-6"}]];

export function ChevronDown(props: IconProps) {
  return Icon(props, chevrondownNode);
}

const downloadNode: IconNode[] = [["path",{"d":"M12 15V3"}],["path",{"d":"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}],["path",{"d":"m7 10 5 5 5-5"}]];

export function Download(props: IconProps) {
  return Icon(props, downloadNode);
}

const imageNode: IconNode[] = [["rect",{"width":"18","height":"18","x":"3","y":"3","rx":"2","ry":"2"}],["circle",{"cx":"9","cy":"9","r":"2"}],["path",{"d":"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"}]];

export function Image(props: IconProps) {
  return Icon(props, imageNode);
}

const infoNode: IconNode[] = [["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"M12 16v-4"}],["path",{"d":"M12 8h.01"}]];

export function Info(props: IconProps) {
  return Icon(props, infoNode);
}

const moonNode: IconNode[] = [["path",{"d":"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"}]];

export function Moon(props: IconProps) {
  return Icon(props, moonNode);
}

const paletteNode: IconNode[] = [["path",{"d":"M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"}],["circle",{"cx":"13.5","cy":"6.5","r":".5","fill":"currentColor"}],["circle",{"cx":"17.5","cy":"10.5","r":".5","fill":"currentColor"}],["circle",{"cx":"6.5","cy":"12.5","r":".5","fill":"currentColor"}],["circle",{"cx":"8.5","cy":"7.5","r":".5","fill":"currentColor"}]];

export function Palette(props: IconProps) {
  return Icon(props, paletteNode);
}

const sunNode: IconNode[] = [["circle",{"cx":"12","cy":"12","r":"4"}],["path",{"d":"M12 2v2"}],["path",{"d":"M12 20v2"}],["path",{"d":"m4.93 4.93 1.41 1.41"}],["path",{"d":"m17.66 17.66 1.41 1.41"}],["path",{"d":"M2 12h2"}],["path",{"d":"M20 12h2"}],["path",{"d":"m6.34 17.66-1.41 1.41"}],["path",{"d":"m19.07 4.93-1.41 1.41"}]];

export function Sun(props: IconProps) {
  return Icon(props, sunNode);
}

const trianglealertNode: IconNode[] = [["path",{"d":"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"}],["path",{"d":"M12 9v4"}],["path",{"d":"M12 17h.01"}]];

export function TriangleAlert(props: IconProps) {
  return Icon(props, trianglealertNode);
}
