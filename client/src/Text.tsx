import styled from "styled-components";

interface Props {
  color: "red" | "blue";
}

const colorMap: Record<string, string> = {
  red: "#ff2300",
  blue: "#00AAFF",
};

export const Text = styled.span<Props>`
  color: ${(props) => colorMap[props.color]};
`;
