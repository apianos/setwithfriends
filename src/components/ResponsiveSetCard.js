import { memo } from "react";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import clsx from "clsx";
import { cardTraits } from "../game";

const useStyles = makeStyles((theme) => ({
  symbol: {
    margin: 3,
  },
  card: {
    boxSizing: "border-box",
    background: "#fff",
    border: `1px solid ${theme.palette.text.primary}`,
    display: "inline-flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: theme.setCard.background,
    transition: "box-shadow 0.15s",
  },
  clickable: {
    cursor: "pointer",
    "@media(hover: hover) and (pointer: fine)": {
      "&:hover": {
        boxShadow: "0px 0px 5px 3px #bbb",
      },
    },
  },
  active: {
    boxShadow: "0px 0px 5px 3px #4b9e9e !important",
  },
  hinted: {
    backgroundColor: theme.setCard.hinted,
  },
}));

const SHAPES = ["squiggle", "oval", "diamond"];
const SHADES = ["filled", "outline", "striped"];

function ResponsiveSymbol(props) {
  const classes = useStyles();
  const color = props.color;
  const shape = SHAPES[props.shape];
  const shade = SHADES[props.shade];

  return (
    <svg
      className={classes.symbol}
      width={props.size}
      height={2 * props.size}
      viewBox="0 0 200 400"
      style={{ transition: "width 0.5s, height 0.5s" }}
    >
      <use
        href={"#" + shape}
        fill={shade === "outline" ? "transparent" : color}
        mask={shade === "striped" ? "url(#mask-stripe)" : ""}
      />
      <use href={"#" + shape} stroke={color} fill="none" strokeWidth={18} />
    </svg>
  );
}

function ResponsiveSetCard(props) {
  const classes = useStyles();
  const theme = useTheme();

  // Black magic below to scale cards given any width
  const { width, value, onClick, hinted, active } = props;
  const height = Math.round(width / 1.6);
  const margin = Math.round(width * 0.035);
  const contentWidth = width - 2 * margin;
  const contentHeight = height - 2 * margin;
  const { color, shape, shade, border, number } = cardTraits(value);

  // Override is used to help visualize new colors in color picker dialog.
  const COLORS = props.colorOverride
    ? [
        props.colorOverride.purple,
        props.colorOverride.green,
        props.colorOverride.red,
      ]
    : [theme.setCard.purple, theme.setCard.green, theme.setCard.red];

  const BORDERS = ["3px solid", "4px dotted", "6px double"];

  return (
    <div
      className={clsx(classes.card, {
        [classes.clickable]: onClick,
        [classes.active]: active,
        [classes.hinted]: hinted,
      })}
      style={{
        width: contentWidth,
        height: contentHeight,
        margin: margin,
        borderRadius: margin,
        border: BORDERS[border],
        transition: "width 0.5s, height 0.5s",
      }}
      onClick={onClick}
    >
      {[...Array(number + 1)].map((_, i) => (
        <ResponsiveSymbol
          key={i}
          color={COLORS[color]}
          shape={shape}
          shade={shade}
          size={Math.round(contentHeight * 0.36)}
          colorOverride={props.colorOverride}
        />
      ))}
    </div>
  );
}

export default memo(ResponsiveSetCard);
