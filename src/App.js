import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import FileSearch from './components/FileSearch';
import FileList from './components/FileList';
import defaultFiles from './utils/defaultFiles';
import ButtonBtn from './components/ButtonBtn';
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons'
import TabList from './components/TabList';


function App() {
  return (
    <div className="App container-fluid px-0">
      <div className='row g-0'>
        <div className='col-4 left-panel'>
          <FileSearch 
            title="My Document"
            onFileSearch={(value) => {console.log(value)}}
          />
          <FileList
            files={defaultFiles}
            onFileClick={(id) => {console.log(id)}}
            onSaveEdit={(id, value) => {console.log(id, value)}}
            onFileDelete={(id) => {console.log(id)}}
          />
          <div className='row g-0'>
            <div className='col'>
              <div className='d-grid gap-2'>
                <ButtonBtn
                  text="新建"
                  colorClass="btn-primary"
                  icon={faPlus}
                  onBtnClick={() => {}}
                />
              </div>
            </div>
            <div className='col'>
              <div className='d-grid gap-2'>
                <ButtonBtn
                  text="导入"
                  colorClass="btn-success"
                  icon={faFileImport}
                  onBtnClick={() => {}}
                />
              </div>
            </div>
          </div>
        </div>
        <div className='col-8 right-panel'>
          <TabList 
            files={defaultFiles}
            activeId="1"
            unSaveId={["2"]}
            onTabClick={ (id) => { console.log(id) } }
            onTabClose={ (id) => { console.log('closeid', id) } }
          />
        </div>
      </div>
    </div>
  );
}

export default App;
