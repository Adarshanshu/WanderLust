(() => {
  const filters = document.querySelectorAll("[data-category-filter]");
  const listings = document.querySelectorAll("[data-listing-category]");
  const emptyState = document.querySelector(".category-empty-state");
  const searchInput = document.querySelector("#navbar-search-query");
  const searchCategory = document.querySelector("#navbar-search-category");

  if (!filters.length || !listings.length) return;

  filters.forEach((filter) => {
    filter.addEventListener("click", () => {
      const category = filter.dataset.categoryFilter;
      const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
      let visibleCount = 0;

      if (searchCategory) searchCategory.value = category;

      filters.forEach((item) => {
        const selected = item === filter;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });

      listings.forEach((listing) => {
        const matchesCategory = category === "all" || listing.dataset.listingCategory === category;
        const matchesQuery = !query || listing.dataset.searchable.includes(query);
        const visible = matchesCategory && matchesQuery;
        listing.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      if (emptyState) emptyState.hidden = visibleCount > 0;
    });
  });
})();
