import Section from "@/components/ui/section/Section";
import styles from "./ProductsHeader.module.css";
import FiltersBar, { type CatalogFilters } from "../filters-bar/FiltersBar";
import Container from "@/components/common/container/Container";

type Props = {
  categories: string[];
  current: CatalogFilters;
};

export default function ProductsHeader({ categories, current }: Props) {
  return (
    <Container>
        <Section
            eyebrow="Our Teas"
            title="Explore Our Products"
            align="left"
            paddingBlock="var(--space-xl)"
            marginBottom={false}
            headingLevel={1}
        >
        <div className={styles.wrapper}>
            <FiltersBar categories={categories} current={current} />
        </div>
        </Section>
    </Container>
  );
}
