import { useContext, useMemo } from "react";

import Divider from "@material-ui/core/Divider";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import { animated, useSprings } from "@react-spring/web";
import useSound from "use-sound";

import { generateCards } from "../game";
import { standardLayouts } from "../util";
import ResponsiveSetCard from "../components/ResponsiveSetCard";
import useDimensions from "../hooks/useDimensions";
import useKeydown, { getModifierState } from "../hooks/useKeydown";
import useStorage from "../hooks/useStorage";
import { SettingsContext } from "../context";
import layoutSfx from "../assets/layoutChangeSound.mp3";

const gamePadding = 8;

function Game({
  deck,
  boardSize,
  onClick,
  onClear,
  selected,
  gameMode,
  answer,
  lastSet,
}) {
  const cardArray = useMemo(() => generateCards(gameMode), [gameMode]);
  const [layoutOrientation, setLayoutOrientation] = useStorage(
    "layout",
    "portrait"
  );
  const [cardOrientation, setCardOrientation] = useStorage(
    "orientation",
    "vertical"
  );
  const { keyboardLayout, volume } = useContext(SettingsContext);
  const keyboardLayoutDesc = standardLayouts[keyboardLayout];
  const isHorizontal = cardOrientation === "horizontal";
  const isLandscape = layoutOrientation === "landscape";
  const [gameDimensions, gameEl] = useDimensions();
  const [playLayout] = useSound(layoutSfx);

  let board = deck.slice(0, boardSize);
  const unplayed = deck.slice(boardSize);
  if (gameMode === "setchain") {
    board = [...lastSet, ...board];
  }

  const lineSpacing =
    gameMode === "setchain" && lastSet.length ? 2 * gamePadding : 0;

  // Calculate widths and heights in pixels to fit cards in the game container
  // (The default value for `gameWidth` is a hack since we don't know the
  //  actual dimensions of the game container on initial render)
  const gameWidth = gameDimensions ? gameDimensions.width : 200;
  const numCards = board.length;

  const rows = isLandscape ? 3 : Math.max(Math.ceil(numCards / 3), 4);
  const cols = isLandscape ? Math.max(Math.ceil(numCards / 3), 4) : 3;

  let cardWidth, cardHeight, gameHeight;
  if (!isHorizontal) {
    if (!isLandscape) {
      cardWidth = Math.floor((gameWidth - 2 * gamePadding) / cols);
      cardHeight = Math.round(cardWidth / 1.6);
      gameHeight = cardHeight * rows + 2 * gamePadding + lineSpacing;
    } else {
      cardWidth = Math.floor(
        (gameWidth - 2 * gamePadding - lineSpacing) / cols
      );
      cardHeight = Math.round(cardWidth / 1.6);
      gameHeight = cardHeight * rows + 2 * gamePadding;
    }
  } else {
    if (!isLandscape) {
      cardHeight = Math.floor((gameWidth - 2 * gamePadding) / cols);
      cardWidth = Math.round(cardHeight * 1.6);
      gameHeight = cardWidth * rows + 2 * gamePadding + lineSpacing;
    } else {
      cardHeight = Math.floor(
        (gameWidth - 2 * gamePadding - lineSpacing) / cols
      );
      cardWidth = Math.round(cardHeight * 1.6);
      gameHeight = cardWidth * rows + 2 * gamePadding;
    }
  }

  // Compute coordinate positions of each card, in and out of play
  const cards = new Map();
  for (const c of cardArray) {
    cards.set(c, {
      positionX: gameWidth,
      positionY: gameHeight / 2 - cardHeight / 2,
      opacity: 0,
      hinted: false,
      inplay: false,
    });
  }

  for (let i = 0; i < board.length; i++) {
    let positionX, positionY;
    let r, c;
    if (!isLandscape) {
      [r, c] = [Math.floor(i / 3), i % 3];
    } else {
      [r, c] = [i % 3, Math.floor(i / 3)];
    }
    if (!isHorizontal) {
      positionX = cardWidth * c + gamePadding;
      positionY = cardHeight * r + gamePadding;
    } else {
      const delta = (cardWidth - cardHeight) / 2; // accounting for rotation
      positionX = cardHeight * c + gamePadding - delta;
      positionY = cardWidth * r + gamePadding + delta;
    }
    if (!isLandscape) {
      positionY = positionY + (i >= 3 ? lineSpacing : 0);
    } else {
      positionX = positionX + (i >= 3 ? lineSpacing : 0);
    }
    cards.set(board[i], {
      positionX,
      positionY,
      opacity: 1,
      hinted: answer ? answer.includes(board[i]) : false,
      inplay: true,
    });
  }
  for (const c of unplayed) {
    cards.set(c, {
      positionX: -cardWidth,
      positionY: gameHeight / 2 - cardHeight / 2,
      opacity: 0,
      hinted: false,
      inplay: false,
    });
  }

  const rotateAmount = isHorizontal ? "90deg" : "0deg";

  const springProps = useSprings(
    cardArray.length,
    cardArray.map((c) => ({
      to: {
        transform: `translate(${cards.get(c).positionX}px, ${
          cards.get(c).positionY
        }px) rotate(${rotateAmount})`,
        opacity: cards.get(c).opacity,
      },
      config: {
        tension: 64,
        friction: 14,
      },
    }))
  );

  // Keyboard shortcuts
  const shortcuts = isLandscape
    ? keyboardLayoutDesc.horizontalLayout
    : keyboardLayoutDesc.verticalLayout;
  useKeydown((event) => {
    if (getModifierState(event) === "") {
      const { key } = event;
      if (key === "Escape" || key === " ") {
        event.preventDefault();
        onClear();
      } else if (key.length === 1 && shortcuts.includes(key.toLowerCase())) {
        event.preventDefault();
        const index = shortcuts.indexOf(key.toLowerCase());
        if (index < board.length) {
          onClick(board[index]);
        }
      } else if (
        key.toLowerCase() === keyboardLayoutDesc.orientationChangeKey
      ) {
        event.preventDefault();
        if (volume === "on") playLayout();
        setCardOrientation(isHorizontal ? "vertical" : "horizontal");
      } else if (key.toLowerCase() === keyboardLayoutDesc.layoutChangeKey) {
        event.preventDefault();
        if (volume === "on") playLayout();
        setLayoutOrientation(isLandscape ? "portrait" : "landscape");
      }
    }
  });

  const lastSetLineStyle = isLandscape
    ? {
        left: `${
          (isHorizontal ? cardHeight : cardWidth) +
          gamePadding +
          lineSpacing / 2
        }px`,
      }
    : {
        top: `${
          (isHorizontal ? cardWidth : cardHeight) +
          gamePadding +
          lineSpacing / 2
        }px`,
      };

  return (
    <Paper
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        height: gameHeight + 19,
        transition: "height 0.75s",
      }}
      ref={gameEl}
    >
      <Typography
        variant="caption"
        align="center"
        style={{
          position: "absolute",
          left:
            isLandscape && lastSet.length
              ? `${gamePadding + (isHorizontal ? cardHeight : cardWidth) / 2}px`
              : 0,
          bottom: gamePadding,
          width: "100%",
        }}
      >
        <strong>{unplayed.length}</strong> cards remaining in the deck
      </Typography>
      {gameMode === "setchain" && lastSet.length ? (
        <Divider
          orientation={isLandscape ? "vertical" : "horizontal"}
          variant="fullWidth"
          absolute={true}
          style={lastSetLineStyle}
        />
      ) : null}
      {cardArray.map((card, idx) => (
        <animated.div
          key={card}
          style={{
            position: "absolute",
            ...springProps[idx],
            visibility: springProps[idx].opacity.to((x) =>
              x > 0 ? "visible" : "hidden"
            ),
            zIndex: cards.get(card).opacity ? "auto" : 1,
          }}
        >
          <ResponsiveSetCard
            value={card}
            width={cardWidth}
            hinted={cards.get(card).hinted}
            active={selected.includes(card)}
            onClick={cards.get(card).inplay ? () => onClick(card) : null}
          />
        </animated.div>
      ))}
    </Paper>
  );
}

export default Game;
