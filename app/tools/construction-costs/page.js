import ToolsHub from '../../../components/tools/ToolsHub';
export const metadata={title:'Construction Costs | K710'};
export default function ConstructionTools(){return <ToolsHub title="Construction Costs" description="Plan building upgrades and the materials needed for each stage." tools={[
 {href:'/tools/construction-costs/calculator',title:'Construction Calculator',description:'Compare building levels, include prerequisites, and calculate resources and time with your construction bonuses.'},
 {href:'/tools/construction-costs/refining',title:'Tempered True Gold Refining Optimizer',description:'',planned:true},
 ]}/>;}
