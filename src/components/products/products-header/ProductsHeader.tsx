import Section from "@/components/ui/section/Section";
import styles from "./ProductsHeader.module.css";
import FiltersBar from "../filters-bar/FiltersBar";
import Container from "@/components/common/container/Container";

export default function ProductsHeader() {
  return (
    <Container>
        <Section
            eyebrow="Our Teas"
            title="Explore Our Products"
            // subtitle="Browse our curated selection of premium teas sourced directly from the finest plantations."
            align="left"
            paddingBlock="var(--space-xl)"
            marginBottom={false}
        >
        <div className={styles.wrapper}>
            <FiltersBar />
        </div>
        </Section>
    </Container>
  );
}
