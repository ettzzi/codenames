import styled from "styled-components";

interface Props {
  color: "red" | "blue" | "killer" | "innocent";
}

export const Banner = styled.div<Props>`
  background-color: ${(props) => props.color.toLowerCase()};
  color: #fff;
  text-align: center;
  font-size: 1.25rem;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.25rem;
`;
