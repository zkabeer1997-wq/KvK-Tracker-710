import ToolsHub from '../../../components/tools/ToolsHub';
export const metadata={title:'Research Tools | K710'};
export default function ResearchTools(){return <ToolsHub title="Research Tools" description="Plan Academy and War Academy upgrades using per-level resource costs and research times." glyph="Research Costs" tools={[
 {href:'/tools/research-costs/academy',title:'Academy Research Costs Calculator',description:'Growth, Economy and Battle research. Set current levels, choose targets, and include prerequisite research.'},
 {href:'/tools/research-costs/war-academy',title:'War Academy Research Costs Calculator',description:'Infantry, Cavalry and Archer research, including True Gold Dust requirements.'},
 {href:'/tools/research-costs/advanced-research',title:'War Academy Advanced Research Costs Calculator',description:'Advanced research costs across Capacity, Combat, Economy and Special branches.'},
 ]}/>;}
