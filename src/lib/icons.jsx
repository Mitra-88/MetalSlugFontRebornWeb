const LIGATURES = {
    Activity: "speed",
    ArrowLeft: "arrow_back",
    Check: "check",
    ChevronDown: "expand_more",
    Download: "download",
    Image: "image",
    Info: "info",
    Moon: "dark_mode",
    Palette: "palette",
    Sun: "light_mode",
    TriangleAlert: "warning",
};

export function MaterialIcon(props) {
    return (
        <span
            class={`material-icons-round ${props.class ?? ""}`}
            classList={props.classList}
            style={{ "font-size": `${props.size ?? 24}px` }}
            aria-hidden="true"
        >
            {props.name}
        </span>
    );
}

const makeIcon = (name) => (props) => <MaterialIcon name={name} {...props} />;

export const Activity = makeIcon("speed");
export const ArrowLeft = makeIcon("arrow_back");
export const Check = makeIcon("check");
export const ChevronDown = makeIcon("expand_more");
export const Download = makeIcon("download");
export const Image = makeIcon("image");
export const Info = makeIcon("info");
export const Moon = makeIcon("dark_mode");
export const Palette = makeIcon("palette");
export const Sun = makeIcon("light_mode");
export const TriangleAlert = makeIcon("warning");
