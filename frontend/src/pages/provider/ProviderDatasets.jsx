import React, { useEffect, useState } from 'react';
import {
  getMyDatasets,
  createDataset,
  setDatasetPublished,
  uploadDatasetFile
} from '../../api/catalogApi.js';

function ProviderDatasets() {
  const [datasets, setDatasets] = useState([]);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    tags: '',
    storageType: 'FILE', // valor por defecto
    storageUri: '',
    dataUrl: '',
    legalBasis: '',
    dataClassification: 'INTERNAL',
    usageTerms: '',
    published: false
  });

  const loadDatasets = async () => {
    try {
      const data = await getMyDatasets();
      setDatasets(data);
    } catch (err) {
      setError(err.message || 'Error al cargar datasets');
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      let storageType = form.storageType;
      let storageUri = form.storageUri;

      // 1) Si hay archivo seleccionado, lo subimos primero
      if (file) {
        const uploadRes = await uploadDatasetFile(file);
        storageType = 'FILE';
        storageUri = uploadRes.storageUri; // p.ej. 'uploads/1234_mis_datos.csv'
      } else if (form.dataUrl) {
        // 2) Si no hay archivo, pero sí URL
        storageType = 'EXTERNAL_API'; // o 'FILE', según cómo lo quieras tratar
        storageUri = form.dataUrl;
      }

      if (!storageUri) {
        throw new Error(
          'Debes subir un archivo o indicar una URL de datos (storageUri)'
        );
      }

      await createDataset({
        name: form.name,
        description: form.description,
        category: form.category,
        tags: form.tags,
        storageType,
        storageUri,
        legalBasis: form.legalBasis,
        dataClassification: form.dataClassification,
        usageTerms: form.usageTerms,
        published: form.published
      });

      // limpiar formulario
      setForm({
        name: '',
        description: '',
        category: '',
        tags: '',
        storageType: 'FILE',
        storageUri: '',
        dataUrl: '',
        legalBasis: '',
        dataClassification: 'INTERNAL',
        usageTerms: '',
        published: false
      });
      setFile(null);

      await loadDatasets();
    } catch (err) {
      setError(err.message || 'Error al crear dataset');
    }
  };

  const togglePublish = async (datasetId, currentPublished) => {
    try {
      await setDatasetPublished(datasetId, !currentPublished);
      await loadDatasets();
    } catch (err) {
      alert(err.message || 'Error al cambiar publicación');
    }
  };

  return (
    <div>
      <h2>Mis datasets</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Crear nuevo dataset</h3>
      <form onSubmit={handleCreate} style={{ maxWidth: '700px' }}>
        <div>
          <label>
            Nombre:
            <input
              type="text"
              value={form.name}
              style={{ width: '100%' }}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Descripción:
            <textarea
              value={form.description}
              style={{ width: '100%' }}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </label>
        </div>

        <div>
          <label>
            Categoría:
            <input
              type="text"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
            />
          </label>
        </div>

        <div>
          <label>
            Tags (separadas por coma):
            <input
              type="text"
              value={form.tags}
              style={{ width: '100%' }}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </label>
        </div>

        <hr />

        <h4>Origen de los datos</h4>
        <p>
          Puedes <strong>subir un archivo</strong> o indicar una{' '}
          <strong>URL de datos</strong>. Si subes archivo, se ignorará la URL.
        </p>

        <div>
          <label>
            Archivo de datos:
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
          </label>
          {file && (
            <div>
              Archivo seleccionado: {file.name} ({Math.round(file.size / 1024)}{' '}
              KB)
            </div>
          )}
        </div>

        <div>
          <label>
            URL de datos (opcional si subes archivo):
            <input
              type="text"
              value={form.dataUrl}
              style={{ width: '100%' }}
              onChange={(e) => setForm({ ...form, dataUrl: e.target.value })}
              placeholder="https://ejemplo.com/datos.csv o endpoint API"
            />
          </label>
        </div>

        <hr />

        <div>
          <label>
            Base legal (GDPR):
            <input
              type="text"
              value={form.legalBasis}
              style={{ width: '100%' }}
              onChange={(e) =>
                setForm({ ...form, legalBasis: e.target.value })
              }
            />
          </label>
        </div>

        <div>
          <label>
            Clasificación de datos:
            <select
              value={form.dataClassification}
              onChange={(e) =>
                setForm({ ...form, dataClassification: e.target.value })
              }
            >
              <option value="PUBLIC">PUBLIC</option>
              <option value="INTERNAL">INTERNAL</option>
              <option value="CONFIDENTIAL">CONFIDENTIAL</option>
            </select>
          </label>
        </div>

        <div>
          <label>
            Términos de uso:
            <textarea
              value={form.usageTerms}
              style={{ width: '100%' }}
              onChange={(e) =>
                setForm({ ...form, usageTerms: e.target.value })
              }
            />
          </label>
        </div>

        <div>
          <label>
            Publicado:
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) =>
                setForm({ ...form, published: e.target.checked })
              }
            />
          </label>
        </div>

        <button type="submit">Crear dataset</button>
      </form>

      <h3>Listado</h3>
      <table border="1" cellPadding="4" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Publicado</th>
            <th>Clasificación</th>
            <th>Tipo</th>
            <th>URI / Origen</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {datasets.map((d) => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>{d.name}</td>
              <td>{d.category || '-'}</td>
              <td>{d.published ? 'Sí' : 'No'}</td>
              <td>{d.dataClassification}</td>
              <td>{d.storageType}</td>
              <td>{d.storageUri || '-'}</td>
              <td>
                <button onClick={() => togglePublish(d.id, d.published)}>
                  {d.published ? 'Hacer privado' : 'Publicar'}
                </button>
              </td>
            </tr>
          ))}
          {datasets.length === 0 && (
            <tr>
              <td colSpan="8">No hay datasets.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ProviderDatasets;