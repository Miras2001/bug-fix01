interface MetadataField {
  id: string;
  label: string;
  category: string;
  description: string;
}

interface SavedView {
  id: string;
  name: string;
  createdAt: number;
  metadataIds: string[];
}

const METADATA: MetadataField[] = [
  {
    id: 'owner',
    label: 'Record owner',
    category: 'People',
    description: 'User responsible for the data record.',
  },
  {
    id: 'region',
    label: 'Sales region',
    category: 'Geography',
    description: 'Market or regional grouping.',
  },
  {
    id: 'channel',
    label: 'Acquisition channel',
    category: 'Marketing',
    description: 'Campaign or channel used for acquisition.',
  },
  {
    id: 'lifecycle',
    label: 'Lifecycle stage',
    category: 'Lifecycle',
    description: 'Stage in the customer lifecycle.',
  },
  {
    id: 'created',
    label: 'Created date',
    category: 'System',
    description: 'When the record was created.',
  },
  {
    id: 'updated',
    label: 'Last updated',
    category: 'System',
    description: 'Most recent modification date.',
  },
  {
    id: 'industry',
    label: 'Industry',
    category: 'Firmographic',
    description: 'Industry based on NAICS mapping.',
  },
  {
    id: 'tier',
    label: 'Account tier',
    category: 'Firmographic',
    description: 'Internal tiering system.',
  },
  {
    id: 'product',
    label: 'Primary product',
    category: 'Product',
    description: 'Primary product tied to the record.',
  },
  {
    id: 'plan',
    label: 'Plan type',
    category: 'Product',
    description: 'Subscription or billing plan.',
  },
  {
    id: 'mrr',
    label: 'Monthly recurring revenue',
    category: 'Finance',
    description: 'Booked recurring revenue amount.',
  },
  {
    id: 'arr',
    label: 'Annual contract value',
    category: 'Finance',
    description: 'Total annualised contract value.',
  },
  {
    id: 'sentiment',
    label: 'Support sentiment',
    category: 'Support',
    description: 'Average satisfaction score.',
  },
  {
    id: 'nps',
    label: 'NPS bucket',
    category: 'Support',
    description: 'Net Promoter Score grouping.',
  },
  {
    id: 'health',
    label: 'Account health',
    category: 'Lifecycle',
    description: 'Heuristic health rating.',
  },
  {
    id: 'renewal',
    label: 'Renewal date',
    category: 'Finance',
    description: 'Next renewal date.',
  },
  {
    id: 'success',
    label: 'Success manager',
    category: 'People',
    description: 'Assigned customer success manager.',
  },
  {
    id: 'csat',
    label: 'CSAT trend',
    category: 'Support',
    description: 'Three month rolling CSAT trend.',
  },
];

const STORAGE_KEY = 'metadata-views';

const metadataList = document.getElementById('metadataList') as HTMLDivElement;
const metadataTemplate = document.getElementById(
  'metadataItemTemplate'
) as HTMLTemplateElement;
const searchInput = document.getElementById('metadataSearch') as HTMLInputElement;
const selectedPreview = document.getElementById('selectedPreview') as HTMLUListElement;
const selectionCount = document.getElementById('selectionCount') as HTMLSpanElement;
const saveButton = document.getElementById('saveViewButton') as HTMLButtonElement;
const saveViewForm = document.getElementById('saveViewForm') as HTMLFormElement;
const viewNameInput = document.getElementById('viewName') as HTMLInputElement;
const viewList = document.getElementById('viewList') as HTMLDivElement;
const viewTemplate = document.getElementById('viewItemTemplate') as HTMLTemplateElement;
const viewDetails = document.getElementById('viewDetails') as HTMLDivElement;
const viewCount = document.getElementById('viewCount') as HTMLSpanElement;
const resetButton = document.getElementById('resetApp') as HTMLButtonElement;

const selectedMetadata = new Map<string, MetadataField>();
let savedViews: SavedView[] = loadSavedViews();
let activeViewId: string | null = null;

function loadSavedViews(): SavedView[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to parse saved views', err);
  }
  return [];
}

function persistViews(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedViews));
}

function renderMetadataList(filter = ''): void {
  const normalized = filter.trim().toLowerCase();
  const matches = METADATA.filter((field) => {
    if (!normalized) return true;
    return (
      field.label.toLowerCase().includes(normalized) ||
      field.category.toLowerCase().includes(normalized) ||
      field.description.toLowerCase().includes(normalized)
    );
  });

  metadataList.innerHTML = '';

  if (matches.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No metadata matches your search.';
    metadataList.appendChild(empty);
    return;
  }

  matches.forEach((field) => {
    const fragment = metadataTemplate.content.cloneNode(true) as DocumentFragment;
    const wrapper = fragment.firstElementChild as HTMLLabelElement | null;
    if (!wrapper) {
      return;
    }
    const checkbox = wrapper.querySelector('input');
    const title = wrapper.querySelector('.meta-title');
    const category = wrapper.querySelector('.meta-category');

    if (!checkbox || !title || !category) {
      return;
    }

    title.textContent = field.label;
    category.textContent = field.category;
    checkbox.checked = selectedMetadata.has(field.id);
    checkbox.setAttribute('aria-label', `${field.label} (${field.category})`);

    wrapper.title = field.description;

    wrapper.addEventListener('change', () => toggleMetadata(field.id));

    metadataList.appendChild(fragment);
  });
}

function toggleMetadata(id: string): void {
  const metadata = METADATA.find((item) => item.id === id);
  if (!metadata) {
    return;
  }

  if (selectedMetadata.has(id)) {
    selectedMetadata.delete(id);
  } else {
    selectedMetadata.set(id, metadata);
  }

  renderSelections();
  renderMetadataList(searchInput.value);
}

function renderSelections(): void {
  const entries = Array.from(selectedMetadata.values());
  selectedPreview.innerHTML = '';
  entries.forEach((item) => {
    const pill = document.createElement('li');
    pill.textContent = item.label;
    selectedPreview.appendChild(pill);
  });

  selectionCount.textContent = `${entries.length} selected`;
  saveButton.disabled = entries.length === 0;
}

function createView(name: string, metadataIds: string[]): SavedView {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `view-${Date.now()}`,
    name,
    createdAt: Date.now(),
    metadataIds,
  };
}

function renderViews(): void {
  viewList.innerHTML = '';
  viewCount.textContent = `${savedViews.length} saved`;

  if (savedViews.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No saved views yet. Create one using the selector.';
    viewList.appendChild(empty);
    viewDetails.innerHTML = '<p class="hint">Select a saved view to see its metadata.</p>';
    activeViewId = null;
    return;
  }

  [...savedViews]
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach((view) => {
      const fragment = viewTemplate.content.cloneNode(true) as DocumentFragment;
      const article = fragment.firstElementChild as HTMLElement | null;
      if (!article) {
        return;
      }
      const title = article.querySelector('.view-title');
      const subtitle = article.querySelector('.view-subtitle');
      const viewBtn = article.querySelector('.view-btn');
      const deleteBtn = article.querySelector('.delete-btn');

      if (!title || !subtitle || !viewBtn || !deleteBtn) {
        return;
      }

      title.textContent = view.name;
      const plural = view.metadataIds.length === 1 ? '' : 's';
      subtitle.textContent = `${view.metadataIds.length} metadata field${plural}`;

      const selectView = () => showViewDetails(view.id);
      viewBtn.addEventListener('click', selectView);
      article.addEventListener('click', (event) => {
        if ((event.target as HTMLElement).closest('button')) {
          return;
        }
        selectView();
      });

      deleteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        deleteView(view.id);
      });

      if (view.id === activeViewId) {
        article.classList.add('is-active');
      }

      viewList.appendChild(fragment);
    });
}

function showViewDetails(viewId: string): void {
  const view = savedViews.find((item) => item.id === viewId);
  if (!view) return;

  activeViewId = viewId;
  const metadata = view.metadataIds
    .map((id) => METADATA.find((item) => item.id === id))
    .filter(Boolean) as MetadataField[];

  const created = new Date(view.createdAt).toLocaleString();

  const heading = document.createElement('div');
  heading.innerHTML = `<strong>${view.name}</strong><p class="hint">Saved ${created}</p>`;

  const list = document.createElement('ul');
  metadata.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${item.label}</strong> — <span>${item.description}</span>`;
    list.appendChild(li);
  });

  viewDetails.innerHTML = '';
  viewDetails.appendChild(heading);
  viewDetails.appendChild(list);

  renderViews();
}

function deleteView(viewId: string): void {
  savedViews = savedViews.filter((view) => view.id !== viewId);
  if (activeViewId === viewId) {
    activeViewId = null;
    viewDetails.innerHTML = '<p class="hint">Select a saved view to see its metadata.</p>';
  }
  persistViews();
  renderViews();
}

saveViewForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = viewNameInput.value.trim() || `Untitled view ${savedViews.length + 1}`;
  const metadataIds = Array.from(selectedMetadata.keys());
  if (metadataIds.length === 0) {
    return;
  }
  const newView = createView(name, metadataIds);
  savedViews.push(newView);
  persistViews();
  renderViews();
  showViewDetails(newView.id);
  saveViewForm.reset();
  selectedMetadata.clear();
  renderSelections();
  renderMetadataList(searchInput.value);
});

searchInput.addEventListener('input', (event) => {
  const value = (event.target as HTMLInputElement).value;
  renderMetadataList(value);
});

resetButton.addEventListener('click', () => {
  if (!confirm('Remove all saved views and selections?')) {
    return;
  }
  selectedMetadata.clear();
  savedViews = [];
  activeViewId = null;
  persistViews();
  renderSelections();
  renderMetadataList('');
  renderViews();
});

renderMetadataList();
renderSelections();
renderViews();

if (savedViews.length > 0) {
  showViewDetails(savedViews[0].id);
}
