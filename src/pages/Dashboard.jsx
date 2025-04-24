import LastRelaseWidget from './LastReleaseWidget.jsx';
import RSSNewsWidget from './RSSNewsWidget.jsx';
import scriptblack from '../../res/scriptblack.png';

export default function Dashboard() {
  return (
    <>
      <img src={scriptblack} alt="VMware Tech Hub Script" className="dashboard-logo" />
      <div className="dashboard-widgets">
        <LastRelaseWidget />
        <RSSNewsWidget />
      </div>
    </>
  );
}
