import styled from "styled-components";

interface Props {
  color?: "red" | "blue" | "killer" | "innocent";
}

const colorMap: Record<string, string> = {
  red: "#ff2300",
  blue: "#00AAFF",
  killer: "#111",
  citizen: "#ccc",
  unknown: "#111",
};

export const Card = styled.button<Props>`
  background-color: #fff;
  box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1),
    0 0 0 1px rgba(10, 10, 10, 0.02);
  color: #4a4a4a;
  max-width: 100%;
  position: relative;
  text-transform: uppercase;
  padding: 2rem 0.75rem;
  font-weight: bold;
  text-align: center;
  border-radius: 4px;
  color: ${(props) => props.color && colorMap[props.color.toLowerCase()]};
  cursor: pointer;
  &:disabled {
    cursor: not-allowed;
  }
  &:empty {
    background-color: #dbdbdb;
  }
`;
